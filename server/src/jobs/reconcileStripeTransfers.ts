// src/jobs/reconcileStripeTransfers.ts
import Stripe from "stripe";
import Payment from "../models/Payment";
import AffiliateSale from "../models/AffiliateSale";
import Affiliate from "../models/Affiliate";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Idempotent reconcile: safe to run on a schedule
export async function reconcileStripeTransfers(sinceHours = 48) {
  const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  // Only Stripe-originated transfers created recently
  const candidates = await Payment.find({
    method: "stripe_transfer",          // <-- ensure resolver sets this
    createdAt: { $gte: cutoff },
    transactionId: { $regex: /^tr_/ },  // Stripe transfer ids
  }).lean();

  for (const p of candidates) {
    try {
      const txId = typeof p.transactionId === "string" ? p.transactionId : undefined;
      if (!txId || !txId.startsWith("tr_")) continue;

      const tr = await stripe.transfers.retrieve(txId);
      const paidAt = new Date(tr.created * 1000);

      if (tr.reversed) {
        // ---------- REVERSAL PATH ----------
        // 1) mark related sales reversed (idempotent)
        await AffiliateSale.updateMany(
          { _id: { $in: p.saleIds }, commissionStatus: { $ne: "reversed" } },
          { $set: { commissionStatus: "reversed", paidAt: undefined, paymentId: p._id } }
        );

        // 2) reflect reversal in Payment (idempotent)
        await Payment.updateOne(
          { _id: p._id },
          {
            $set: {
              status: "transfer_reversed",
              transferId: tr.id,
              balanceTransactionId: String(tr.balance_transaction ?? ""),
              currency: tr.currency,
            },
          }
        );

        // 3) update paymentHistory entry if it exists; if not, push one
        const snapUpdate = await Affiliate.updateOne(
          { _id: p.affiliateId },
          {
            $set: {
              "paymentHistory.$[snap].status": "transfer_reversed",
              "paymentHistory.$[snap].paidAt": undefined,
              "paymentHistory.$[snap].currency": tr.currency,
            },
          },
          { arrayFilters: [{ "snap.transactionId": txId }] }
        );

        if (snapUpdate.matchedCount === 0) {
          // no snapshot yet → push a reversal entry (confirmed-only policy)
          await Affiliate.updateOne(
            { _id: p.affiliateId },
            {
              $push: {
                paymentHistory: {
                  paymentId: p._id,
                  refId: p.refId,
                  affiliateId: p.affiliateId,
                  saleIds: p.saleIds,
                  saleAmount: p.saleAmount,
                  paidCommission: p.paidCommission,
                  productName: p.productName ?? "Commission payout",
                  date: p.date,
                  method: p.method,
                  transactionId: p.transactionId,
                  notes: p.notes,
                  currency: tr.currency,
                  status: "transfer_reversed",
                },
              },
            }
          );
        }

        continue; // next candidate
      }

      // ---------- SUCCESS PATH (NOT REVERSED) ----------
      // 1) mark related sales paid (idempotent)
      await AffiliateSale.updateMany(
        { _id: { $in: p.saleIds }, commissionStatus: { $in: ["unpaid", "processing"] } },
        { $set: { commissionStatus: "paid", paidAt, paymentId: p._id } }
      );

      // 2) update Payment to final paid state (idempotent)
      await Payment.updateOne(
        { _id: p._id },
        {
          $set: {
            status: "paid",
            paidAt,
            transferId: tr.id,
            balanceTransactionId: String(tr.balance_transaction ?? ""),
            currency: tr.currency,
          },
        }
      );

      // 3) update existing affiliate snapshot (common case if you added it in the resolver)
      const result = await Affiliate.updateOne(
        { _id: p.affiliateId },
        {
          $set: {
            "paymentHistory.$[snap].status": "paid",
            "paymentHistory.$[snap].paidAt": paidAt,
            "paymentHistory.$[snap].currency": tr.currency,
            // ensure other fields are in sync (in case they were undefined before)
            "paymentHistory.$[snap].saleAmount": p.saleAmount,
            "paymentHistory.$[snap].paidCommission": p.paidCommission,
            "paymentHistory.$[snap].productName": p.productName ?? "Commission payout",
            "paymentHistory.$[snap].notes": p.notes,
            "paymentHistory.$[snap].method": p.method,
          },
        },
        { arrayFilters: [{ "snap.transactionId": txId }] }
      );

      // 4) if no snapshot existed (confirmed-only policy), push one now
      if (result.matchedCount === 0) {
        await Affiliate.updateOne(
          { _id: p.affiliateId },
          {
            $push: {
              paymentHistory: {
                paymentId: p._id,
                refId: p.refId,
                affiliateId: p.affiliateId,
                saleIds: p.saleIds,
                saleAmount: p.saleAmount,
                paidCommission: p.paidCommission,
                productName: p.productName ?? "Commission payout",
                date: paidAt ?? p.date,        // prefer the Stripe timestamp
                method: p.method,              // "stripe_transfer"
                transactionId: p.transactionId,
                notes: p.notes,
                currency: tr.currency,
                status: "paid",
                paidAt,
              },
            },
          }
        );
      }

      // 5) bump denormalized totals (optional; idempotent-ish)
      //    If you need strict idempotency, track a ledger journal instead.
      await Affiliate.updateOne(
        { _id: p.affiliateId },
        { $inc: { totalCommissions: p.paidCommission || 0 } }
      );
    } catch (err: any) {
      console.warn(
        `[reconcile] transfer retrieve failed for Payment ${p._id} (${p.transactionId}):`,
        err?.message || err
      );
    }
  }
}
