// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import mongoose, { Types } from "mongoose";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
import Payment from "../models/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// IMPORTANT (server.ts):
// app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Received webhook call...");
  const sig = req.headers["stripe-signature"] as string | undefined;
  const ua = String(req.headers["user-agent"] || "");

  // Allow Stripe + Stripe CLI only. Soft-ignore noise from random bots.
  if (
    !sig ||
    !sig.includes("t=") ||
    !sig.includes("v1=") ||
    !/^Stripe\//i.test(ua)
  ) {
    console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
    return res.status(200).send("ok");
  }

  let event: Stripe.Event;
  try {
    console.log("🔑 Verifying Stripe signature...");
    // NOTE: req.body must be the raw Buffer (see server.ts)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verified.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logEventHeader(event);

  try {
    switch (event.type) {
      // --------- TRANSFERS (platform → connected account) ---------
      case "transfer.created": {
        const t = event.data.object as Stripe.Transfer;
        // If you have a Payment doc for this transfer, use it; otherwise match by transferId later.
        const payment = await Payment.findOne({ transactionId: t.id });

        const saleFilter: any = payment
          ? { _id: { $in: payment.saleIds } }
          : { transferId: t.id };

        const upd = await AffiliateSale.updateMany(saleFilter, {
          $set: {
            commissionStatus: "processing",
            transferId: t.id,
            stripeAccountId: String(t.destination || ""),
            processingAt: new Date(),
          },
        });

        console.log(
          `[WH] transfer.created → set processing: matched=${
            (upd as any).matchedCount ?? (upd as any).n
          }, modified=${(upd as any).modifiedCount ?? (upd as any).nModified}`
        );
        break;
      }

      case "transfer.reversed": {
        const t = event.data.object as Stripe.Transfer;
        const reason =
          (t.reversals?.data?.[0] as any)?.reason ??
          (t.reversals?.data?.[0] as any)?.metadata?.reason ??
          "n/a";
        console.log(
          `[WH] transfer.reversed tr=${t.id} amount=${(t.amount / 100).toFixed(
            2
          )} ${t.currency} reason=${reason}`
        );

        const payment = await Payment.findOne({ transactionId: t.id });
        const saleFilter: any = payment
          ? { _id: { $in: payment.saleIds } }
          : { transferId: t.id };

        const upd = await AffiliateSale.updateMany(
          { ...saleFilter, commissionStatus: { $in: ["processing", "paid"] } },
          { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
        );
        console.log(
          `[WH] sales set to reversed: modified=${
            (upd as any).modifiedCount ?? (upd as any).nModified
          }`
        );

        // Optional: restore affiliate totals/history if you previously decremented on paid.
        break;
      }

      case "transfer.updated": {
        const t = event.data.object as Stripe.Transfer;
        console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
        // Optional: sync metadata/description to a Payment.notes if desired
        break;
      }

      // --------- PAYOUTS (connected account → bank) ---------
      // We flip PROCESSING → PAID only when the payout is paid.
      case "payout.created":
      case "payout.updated":
      case "payout.canceled":
      case "payout.failed":
      case "payout.paid": {
        const p = event.data.object as Stripe.Payout;
        const acctId = (event.account as string) || "";

        // Mark paid only when status is "paid"
        if (
          event.type === "payout.paid" ||
          (event.type === "payout.updated" && p.status === "paid")
        ) {
          const upd = await AffiliateSale.updateMany(
            { stripeAccountId: acctId, commissionStatus: "processing" },
            {
              $set: {
                commissionStatus: "paid",
                paidAt: new Date(),
                payoutId: p.id,
              },
            }
          );
          console.log(
            `[WH] payout → processing→paid: matched=${
              (upd as any).matchedCount ?? (upd as any).n
            }, modified=${(upd as any).modifiedCount ?? (upd as any).nModified}`
          );
        }

        // If payout fails/cancels, revert processing back to unpaid
        if (
          event.type === "payout.failed" ||
          event.type === "payout.canceled"
        ) {
          const up2 = await AffiliateSale.updateMany(
            { stripeAccountId: acctId, commissionStatus: "processing" },
            { $set: { commissionStatus: "unpaid" } }
          );
          console.log(
            `[WH] payout failed/canceled → processing→unpaid: modified=${
              (up2 as any).modifiedCount ?? (up2 as any).nModified
            }`
          );
        }
        break;
      }

      // ===================== REFUND EVENTS (CUSTOMER-LEVEL) =====================
      case "refund.created": {
        const r = event.data.object as Stripe.Refund;
        await processRefund(r, "created");
        break;
      }
      case "refund.updated": {
        const r = event.data.object as Stripe.Refund;
        await processRefund(r, "updated");
        break;
      }
      case "refund.failed": {
        const r = event.data.object as Stripe.Refund;
        await processRefund(r, "failed");
        break;
      }

      // ---------- FYI ----------
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("💰 payment_intent.succeeded", pi.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
        break;
    }

    return res.status(200).send("success");
  } catch (e: any) {
    console.error("🧨 Handler error:", e?.message || e);
    // 500 lets Stripe retry on transient errors.
    return res.status(500).send("handler error");
  }
}

/**
 * Core refund processor.
 * (unchanged from your version)
 */
async function processRefund(refund: Stripe.Refund, source: string) {
  const refundId = refund.id; // rf_...
  const currency = refund.currency;
  const refundAmount = Number(refund.amount || 0) / 100;
  const chargeId =
    typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
  const piId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : (refund.payment_intent as any)?.id;
  const status = refund.status || "unknown";

  console.log(
    `[REFUND] ${source} rf=${refundId} charge=${chargeId ?? "-"} pi=${
      piId ?? "-"
    } ` + `amount=${refundAmount.toFixed(2)} ${currency} status=${status}`
  );

  const sale = await findAffiliateSaleForRefund(refund);
  if (!sale) {
    console.warn(
      "[REFUND] No AffiliateSale matched this refund. Metadata:",
      refund.metadata
    );
    return;
  }

  const saleAmount = Number(
    (sale as any).amount ?? (sale as any).saleAmount ?? 0
  );
  const commissionEarned = Number((sale as any).commissionEarned ?? 0);
  const alreadyPaid =
    (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt;

  const proportion =
    saleAmount > 0 ? Math.min(1, refundAmount / saleAmount) : 0;
  const commissionToReverse = round2(commissionEarned * proportion);

  const existingIdx = Array.isArray((sale as any).refunds)
    ? (sale as any).refunds.findIndex((r: any) => r.id === refundId)
    : -1;

  if (existingIdx >= 0) {
    const setObj: any = {};
    setObj[`refunds.${existingIdx}.status`] = status;
    setObj[`refunds.${existingIdx}.amount`] = refundAmount;
    setObj[`refunds.${existingIdx}.updatedAt`] = new Date();
    const topLevelStatus = statusMapToSaleRefundStatus(status, proportion);
    setObj["refundStatus"] = topLevelStatus;

    await AffiliateSale.updateOne({ _id: (sale as any)._id }, { $set: setObj });
    console.log("[REFUND] Updated existing refund record on sale.");
    return;
  }

  const pushRefund = {
    id: refundId,
    amount: refundAmount,
    status,
    createdAt: new Date(),
  };

  const saleUpdate: any = {
    $push: { refunds: pushRefund },
    $set: {
      refundStatus: statusMapToSaleRefundStatus(status, proportion),
      refundedAt: new Date(),
    },
    $inc: { refundTotal: refundAmount },
  };

  if (alreadyPaid) {
    await Affiliate.updateOne(
      { _id: (sale as any).affiliateId },
      {
        $inc: { totalCommissions: commissionToReverse },
        $push: {
          paymentHistory: {
            saleAmount: -refundAmount,
            paidCommission: -commissionToReverse,
            productName: `Clawback for refund ${refundId}`,
            date: new Date(),
            method: "stripe_transfer_clawback",
            transactionId: `refund:${refundId}`,
            notes: buildRefundNotes(refund, commissionToReverse),
          },
        },
      }
    );
    saleUpdate.$set.commissionStatus = "refunded";
  } else {
    await Affiliate.updateOne(
      { _id: (sale as any).affiliateId },
      { $inc: { totalCommissions: -commissionToReverse } }
    );
    saleUpdate.$set.commissionStatus = "refunded";
  }

  await AffiliateSale.updateOne({ _id: (sale as any)._id }, saleUpdate);
  console.log(
    `[REFUND] Sale ${String((sale as any)._id)} marked refunded; ` +
      `${alreadyPaid ? "clawback recorded" : "unpaid pool decremented"}; ` +
      `rev_commission=${commissionToReverse.toFixed(2)} on proportion=${(
        proportion * 100
      ).toFixed(1)}%`
  );
}

async function findAffiliateSaleForRefund(refund: Stripe.Refund) {
  const meta = refund.metadata || {};
  const saleId = meta.affiliateSaleId || meta.saleId;
  const maybeObjectId =
    saleId && Types.ObjectId.isValid(saleId)
      ? new Types.ObjectId(saleId)
      : null;

  const chargeId =
    typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
  const piId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : (refund.payment_intent as any)?.id;

  const orderId =
    meta.woo_order_id ||
    meta.order_id ||
    meta.orderId ||
    meta.woocommerce_order_id;

  const or: any[] = [];
  if (maybeObjectId) or.push({ _id: maybeObjectId });
  if (chargeId) or.push({ stripeChargeId: chargeId });
  if (piId) or.push({ stripePaymentIntentId: piId });
  if (orderId) or.push({ orderId: String(orderId) });

  if (!or.length) return null;

  if (maybeObjectId) {
    const byId = await AffiliateSale.findById(maybeObjectId).lean();
    if (byId) return byId;
  }

  const sale = await AffiliateSale.findOne({ $or: or }).lean();
  return sale;
}

function statusMapToSaleRefundStatus(
  refundStatus: string,
  proportion: number
): string {
  const isFull = proportion >= 0.999;
  switch (refundStatus) {
    case "pending":
      return isFull ? "refund_pending_full" : "refund_pending_partial";
    case "succeeded":
      return isFull ? "refund_succeeded_full" : "refund_succeeded_partial";
    case "failed":
      return "refund_failed";
    default:
      return isFull ? "refunded" : "partially_refunded";
  }
}

function buildRefundNotes(refund: Stripe.Refund, commissionToReverse: number) {
  const parts = [
    `Refund ${refund.id}`,
    refund.reason ? `reason=${refund.reason}` : "",
    `status=${refund.status}`,
    `rev_commission=${commissionToReverse.toFixed(2)}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

function logEventHeader(event: Stripe.Event) {
  const acct = event.account ? ` acct=${event.account}` : "";
  console.log(`[WH] ▶︎ Event id=${event.id} type=${event.type}${acct}`);
}

function iso(unixSeconds?: number) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : "n/a";
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
