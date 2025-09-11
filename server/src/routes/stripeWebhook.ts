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
        console.log(
          `[WH] transfer.created tr=${t.id} amount=${(t.amount / 100).toFixed(
            2
          )} ${t.currency} ` +
            `dest=${t.destination} created=${iso(t.created)} acct=${
              event.account ?? "-"
            }`
        );

        // 1) Find the Payment doc created by your resolver (transactionId == tr_...)
        const payment = await Payment.findOne({ transactionId: t.id });
        if (!payment) {
          console.warn(
            "[WH] No Payment matched transfer id; metadata:",
            t.metadata
          );
          break;
        }

        // 2) Mark linked sales PAID (only from unpaid/processing)
        const upd = await AffiliateSale.updateMany(
          {
            _id: { $in: payment.saleIds },
            commissionStatus: { $in: ["unpaid", "processing"] },
          },
          {
            $set: {
              commissionStatus: "paid",
              paidAt: new Date(),
              paymentId: payment._id,
            },
          }
        );
        console.log(
          `[WH] sales updated to paid: matched=${
            (upd as any).matchedCount ?? (upd as any).n
          } modified=${(upd as any).modifiedCount ?? (upd as any).nModified}`
        );

        // 3) If transitioned, append confirmed history & decrement unpaid pool
        const changed =
          ((upd as any).modifiedCount ?? (upd as any).nModified ?? 0) > 0;

        if (changed) {
          // Guard against duplicate history lines
          const already = await Affiliate.findOne({
            _id: payment.affiliateId,
            paymentHistory: { $elemMatch: { transactionId: t.id } },
          }).lean();

          if (!already) {
            await Affiliate.updateOne(
              { _id: payment.affiliateId },
              {
                $inc: {
                  totalCommissions: -Number(payment.paidCommission || 0),
                },
                $push: {
                  paymentHistory: {
                    saleAmount: payment.saleAmount,
                    paidCommission: payment.paidCommission,
                    productName: payment.productName ?? "Commission payout",
                    date: new Date(), // confirmed at webhook time
                    method: payment.method,
                    transactionId: t.id,
                    notes: payment.notes,
                  },
                },
              }
            );
            console.log(
              "[WH] affiliate history appended & totals decremented."
            );
          } else {
            console.log(
              "[WH] history already contains this transfer; skipping push/inc."
            );
          }
        } else {
          console.log(
            "[WH] no sale state changed (probably already paid); skipping history/inc."
          );
        }

        // Optional: reflect status on Payment
        // await Payment.updateOne({ _id: payment._id }, { $set: { status: "succeeded" } });
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
        if (!payment) break;

        const upd = await AffiliateSale.updateMany(
          { _id: { $in: payment.saleIds }, commissionStatus: "paid" },
          { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
        );
        console.log(
          `[WH] sales set to reversed: modified=${
            (upd as any).modifiedCount ?? (upd as any).nModified
          }`
        );

        const changed =
          ((upd as any).modifiedCount ?? (upd as any).nModified ?? 0) > 0;

        if (changed) {
          await Affiliate.updateOne(
            { _id: payment.affiliateId },
            {
              $inc: { totalCommissions: Number(payment.paidCommission || 0) },
              $push: {
                paymentHistory: {
                  saleAmount: -Number(payment.saleAmount || 0),
                  paidCommission: -Number(payment.paidCommission || 0),
                  productName: `Reversal: ${
                    payment.productName ?? "Commission payout"
                  }`,
                  date: new Date(),
                  method: payment.method,
                  transactionId: `${t.id}-reversed`,
                  notes: `Stripe reversed transfer ${t.id}${
                    reason ? ` (${reason})` : ""
                  }`,
                },
              },
            }
          );
          console.log(
            "[WH] affiliate history appended & totals incremented (clawback)."
          );
        }

        // Optional: mark payment as reversed
        // await Payment.updateOne({ _id: payment._id }, { $set: { status: "reversed" } });
        break;
      }

      case "transfer.updated": {
        const t = event.data.object as Stripe.Transfer;
        console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
        // Optional: sync metadata/description to Payment.notes
        break;
      }

      // --------- PAYOUTS (connected account → bank) ---------
      case "payout.created":
      case "payout.updated":
      case "payout.canceled":
      case "payout.failed":
      case "payout.paid": {
        const p = event.data.object as Stripe.Payout;
        console.log(
          `[WH] ${event.type} po=${p.id} amount=${(p.amount / 100).toFixed(
            2
          )} ${p.currency} ` +
            `status=${p.status} arrival=${
              p.arrival_date ? iso(p.arrival_date) : "n/a"
            } acct=${event.account ?? "-"}`
        );
        // Optional: persist payout info per connected account.
        break;
      }

      // ===================== REFUND EVENTS (CUSTOMER-LEVEL) =====================
      // We prefer using refund.* as the source of truth (they carry refund object directly).
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
 * - Resolves AffiliateSale by several identifiers (refund/charge/PI/orderId/saleId).
 * - Computes pro-rata commission reversal for partial refunds.
 * - Updates AffiliateSale refund trail & status.
 * - Adjusts Affiliate.totalCommissions:
 *    - unpaid/processing → decrement (we won't pay what was refunded)
 *    - paid → append clawback record & increment (recover on next payout)
 * - Idempotent: if the refund.id is already recorded, only status/notes are updated.
 */
async function processRefund(refund: Stripe.Refund, source: string) {
  // Basic refund facts
  const refundId = refund.id; // rf_...
  const currency = refund.currency;
  const refundAmount = Number(refund.amount || 0) / 100; // convert to major units
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

  // Try to locate the related AffiliateSale.
  const sale = await findAffiliateSaleForRefund(refund);
  if (!sale) {
    console.warn(
      "[REFUND] No AffiliateSale matched this refund. Metadata:",
      refund.metadata
    );
    return;
  }

  // Sale facts needed for pro-rata computation
  const saleAmount = Number(
    (sale as any).amount ?? (sale as any).saleAmount ?? 0
  ); // your schema may use "amount" or "saleAmount"
  const commissionEarned = Number((sale as any).commissionEarned ?? 0);
  const alreadyPaid =
    (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt;

  // Compute refund proportion (cap at 1.0)
  const proportion =
    saleAmount > 0 ? Math.min(1, refundAmount / saleAmount) : 0;

  // Commission to reverse (pro-rata on partial refunds)
  const commissionToReverse = round2(commissionEarned * proportion);

  // Idempotency: if we’ve already recorded this refund.id on the sale, only refresh status/aggregate.
  const existingIdx = Array.isArray((sale as any).refunds)
    ? (sale as any).refunds.findIndex((r: any) => r.id === refundId)
    : -1;

  if (existingIdx >= 0) {
    // Update in-place (e.g., status moved from pending → succeeded/failed)
    const setObj: any = {};
    setObj[`refunds.${existingIdx}.status`] = status;
    setObj[`refunds.${existingIdx}.amount`] = refundAmount;
    setObj[`refunds.${existingIdx}.updatedAt`] = new Date();

    // If fully refunded (charge.refunded) you may also set a top-level "refundStatus"
    const topLevelStatus = statusMapToSaleRefundStatus(status, proportion);
    setObj["refundStatus"] = topLevelStatus;

    await AffiliateSale.updateOne({ _id: (sale as any)._id }, { $set: setObj });
    console.log("[REFUND] Updated existing refund record on sale.");
    return;
  }

  // New refund instance on this sale — push trail entry first
  const pushRefund = {
    id: refundId,
    amount: refundAmount,
    status,
    createdAt: new Date(), // now (webhook time)
  };

  // Build sale-level updates
  const saleUpdate: any = {
    $push: { refunds: pushRefund },
    $set: {
      refundStatus: statusMapToSaleRefundStatus(status, proportion),
      refundedAt: new Date(),
    },
    $inc: {
      refundTotal: refundAmount,
    },
  };

  // We adjust affiliate balances differently depending on whether the sale was already paid
  // at the time of refund.
  if (alreadyPaid) {
    // ---- CLAWBACK PATH ----
    // The commission was already paid to the affiliate. We need to claw it back:
    // 1) Increment Affiliate.totalCommissions (so the platform can recoup in the next payout).
    // 2) Append a negative line to Affiliate.paymentHistory to keep a transparent audit trail.
    await Affiliate.updateOne(
      { _id: (sale as any).affiliateId },
      {
        $inc: { totalCommissions: commissionToReverse },
        $push: {
          paymentHistory: {
            saleAmount: -refundAmount, // negative reflects the refunded customer amount (optional for history)
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

    // Mark the sale as refunded but keep paymentId for traceability
    saleUpdate.$set.commissionStatus = "refunded"; // your app can show "refunded (clawback)"
  } else {
    // ---- UNPAID PATH ----
    // The commission hasn’t been paid yet. Reduce the unpaid pool so you don’t pay it later.
    await Affiliate.updateOne(
      { _id: (sale as any).affiliateId },
      { $inc: { totalCommissions: -commissionToReverse } }
    );

    // Mark the sale as refunded (not paid; no clawback record needed)
    saleUpdate.$set.commissionStatus = "refunded";
  }

  // Persist the sale updates
  await AffiliateSale.updateOne({ _id: (sale as any)._id }, saleUpdate);
  console.log(
    `[REFUND] Sale ${String((sale as any)._id)} marked refunded; ` +
      `${alreadyPaid ? "clawback recorded" : "unpaid pool decremented"}; ` +
      `rev_commission=${commissionToReverse.toFixed(2)} on proportion=${(
        proportion * 100
      ).toFixed(1)}%`
  );
}

/**
 * Attempt to find the AffiliateSale corresponding to a refund.
 * Tries, in order:
 *  - explicit affiliateSaleId in metadata
 *  - stripe charge id
 *  - stripe payment_intent id
 *  - merchant order id in metadata (woo_order_id / order_id)
 */
async function findAffiliateSaleForRefund(refund: Stripe.Refund) {
  // Gather potential keys
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

  // Build an $or query with only the predicates that exist
  const or: any[] = [];
  if (maybeObjectId) or.push({ _id: maybeObjectId });
  if (chargeId) or.push({ stripeChargeId: chargeId });
  if (piId) or.push({ stripePaymentIntentId: piId });
  if (orderId) or.push({ orderId: String(orderId) });

  if (!or.length) return null;

  // Prefer an exact id match if present
  if (maybeObjectId) {
    const byId = await AffiliateSale.findById(maybeObjectId).lean();
    if (byId) return byId;
  }

  // Otherwise look by external ids
  const sale = await AffiliateSale.findOne({ $or: or }).lean();
  return sale;
}

/**
 * Maps Stripe Refund.status + proportion to a sale-level human status.
 * You can adapt labels to your UI ("refund_pending", "refund_succeeded", etc.)
 */
function statusMapToSaleRefundStatus(
  refundStatus: string,
  proportion: number
): string {
  const isFull = proportion >= 0.999; // ~100% refunded
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

/** Build a clear clawback note string */
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

// import { Request, Response } from "express";
// import Stripe from "stripe";
// import Affiliate from "../models/Affiliate";
// import AffiliateSale from "../models/AffiliateSale";
// import Payment from "../models/Payment";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// // IMPORTANT (server.ts):
// // app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// export default async function stripeWebhook(req: Request, res: Response) {
//   console.log("🔔 Received webhook call...");
//   const sig = req.headers["stripe-signature"] as string | undefined;
//   const ua = String(req.headers["user-agent"] || "");

//   // Allow Stripe + Stripe CLI only. Soft-ignore noise.
//   if (!sig || !sig.includes("t=") || !sig.includes("v1=") || !/^Stripe\//i.test(ua)) {
//     console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
//     return res.status(200).send("ok");
//   }

//   let event: Stripe.Event;
//   try {
//     console.log("🔑 Verifying Stripe signature...");
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     console.log("✅ Signature verified.");
//   } catch (err: any) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   logEventHeader(event);

//   try {
//     switch (event.type) {
//       // ---------- TRANSFERS (platform → connected account) ----------
//       case "transfer.created": {
//         const t = event.data.object as Stripe.Transfer;
//         console.log(
//           `[WH] transfer.created tr=${t.id} amount=${(t.amount / 100).toFixed(2)} ${t.currency} ` +
//           `dest=${t.destination} created=${iso(t.created)} acct=${event.account ?? "-"}`
//         );

//         // 1) Find our Payment doc created by the resolver (transactionId == tr_...)
//         const payment = await Payment.findOne({ transactionId: t.id });
//         if (!payment) {
//           console.warn("[WH] No Payment matched transfer id; metadata:", t.metadata);
//           break;
//         }

//         // 2) Mark linked sales paid (only move from unpaid/processing → paid)
//         const upd = await AffiliateSale.updateMany(
//           { _id: { $in: payment.saleIds }, commissionStatus: { $in: ["unpaid", "processing"] } },
//           { $set: { commissionStatus: "paid", paidAt: new Date(), paymentId: payment._id } }
//         );
//         console.log(`[WH] sales updated to paid: matched=${upd.matchedCount ?? (upd as any).n} modified=${upd.modifiedCount ?? (upd as any).nModified}`);

//         // 3) If any sales transitioned, append a confirmed history entry and decrement unpaid pool
//         if ((upd.modifiedCount ?? (upd as any).nModified ?? 0) > 0) {
//           // Push to history only if this transfer not already present
//           const existing = await Affiliate.findOne({
//             _id: payment.affiliateId,
//             paymentHistory: { $elemMatch: { transactionId: t.id } },
//           }).lean();

//           if (!existing) {
//             await Affiliate.updateOne(
//               { _id: payment.affiliateId },
//               {
//                 $inc: { totalCommissions: -Number(payment.paidCommission || 0) },
//                 $push: {
//                   paymentHistory: {
//                     saleAmount: payment.saleAmount,
//                     paidCommission: payment.paidCommission,
//                     productName: payment.productName ?? "Commission payout",
//                     date: new Date(), // confirmed at webhook time
//                     method: payment.method,
//                     transactionId: t.id,
//                     notes: payment.notes,
//                   },
//                 },
//               }
//             );
//             console.log("[WH] affiliate history appended & totals decremented.");
//           } else {
//             console.log("[WH] history already contains this transfer; skipping push/inc.");
//           }
//         } else {
//           console.log("[WH] no sale state changed (probably already paid); skipping history/inc.");
//         }

//         // (Optional) store a status field on Payment if your schema allows it
//         // await Payment.updateOne({ _id: payment._id }, { $set: { status: "succeeded" } });

//         break;
//       }

//       case "transfer.reversed": {
//         const t = event.data.object as Stripe.Transfer;
//         const reason =
//           (t.reversals?.data?.[0] as any)?.reason ??
//           (t.reversals?.data?.[0] as any)?.metadata?.reason ??
//           "n/a";
//         console.log(
//           `[WH] transfer.reversed tr=${t.id} amount=${(t.amount / 100).toFixed(2)} ${t.currency} reason=${reason}`
//         );

//         // If you want to reflect reversals, do the inverse:
//         const payment = await Payment.findOne({ transactionId: t.id });
//         if (!payment) break;

//         const upd = await AffiliateSale.updateMany(
//           { _id: { $in: payment.saleIds }, commissionStatus: "paid" },
//           { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
//         );
//         console.log(`[WH] sales set to reversed: modified=${upd.modifiedCount ?? (upd as any).nModified}`);

//         if ((upd.modifiedCount ?? (upd as any).nModified ?? 0) > 0) {
//           // refund the unpaid pool and append a reversal record
//           await Affiliate.updateOne(
//             { _id: payment.affiliateId },
//             {
//               $inc: { totalCommissions: Number(payment.paidCommission || 0) },
//               $push: {
//                 paymentHistory: {
//                   saleAmount: -payment.saleAmount,
//                   paidCommission: -(payment.paidCommission ?? payment.saleAmount),
//                   productName: `Reversal: ${payment.productName ?? "Commission payout"}`,
//                   date: new Date(),
//                   method: payment.method,
//                   transactionId: `${t.id}-reversed`,
//                   notes: `Stripe reversed transfer ${t.id}${reason ? ` (${reason})` : ""}`,
//                 },
//               },
//             }
//           );
//         }

//         // (Optional) mark payment as reversed if your schema has a field for that
//         // await Payment.updateOne({ _id: payment._id }, { $set: { status: "reversed" } });
//         break;
//       }

//       case "transfer.updated": {
//         const t = event.data.object as Stripe.Transfer;
//         console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
//         // Optional: sync description/metadata->Payment.notes if you care
//         break;
//       }

//       // ---------- PAYOUTS (connected account → bank) ----------
//       case "payout.created":
//       case "payout.updated":
//       case "payout.canceled":
//       case "payout.failed":
//       case "payout.paid": {
//         const p = event.data.object as Stripe.Payout;
//         console.log(
//           `[WH] ${event.type} po=${p.id} amount=${(p.amount / 100).toFixed(2)} ${p.currency} ` +
//           `status=${p.status} arrival=${p.arrival_date ? iso(p.arrival_date) : "n/a"} acct=${event.account ?? "-"}`
//         );
//         // You can store payout info on the connected account if desired.
//         break;
//       }

//       // ---------- FYI ----------
//       case "payment_intent.succeeded": {
//         const pi = event.data.object as Stripe.PaymentIntent;
//         console.log("💰 payment_intent.succeeded", pi.id);
//         break;
//       }

//       default:
//         console.log("ℹ️ Unhandled event type:", event.type);
//         break;
//     }

//     return res.status(200).send("success");
//   } catch (e: any) {
//     console.error("🧨 Handler error:", e?.message || e);
//     // 500 lets Stripe retry on transient errors.
//     return res.status(500).send("handler error");
//   }
// }

// function logEventHeader(event: Stripe.Event) {
//   const acct = event.account ? ` acct=${event.account}` : "";
//   console.log(`[WH] ▶︎ Event id=${event.id} type=${event.type}${acct}`);
// }

// function iso(unixSeconds?: number) {
//   return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : "n/a";
// }
