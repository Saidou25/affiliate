// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { Types } from "mongoose";
import AffiliateSale from "../models/AffiliateSale";
import Payment from "../models/Payment";
import Affiliate from "../models/Affiliate"; // ⬅️ added (needed for refId lookup on refunds)
import {
  handleDisconnect,
  recordState,
} from "../services/notifications/onboarding";
import { notifyRefundSucceeded } from "../services/notifications/payments"; // ⬅️ already added in your version

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// IMPORTANT (server.ts):
// app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default async function stripeWebhook(req: Request, res: Response) {
  if (req.query.__test) {
  console.log("[DEV TEST] HARD BYPASS →", req.query.__test);
  return res.status(200).send("HARD BYPASS HIT ✅");
}

  console.log(
    "→ webhook TOP | __test =",
    req.query.__test,
    "| UA =",
    req.headers["user-agent"]
  );

  // ── DEV TEST SHIM (must be first!) ─────────────────────────────
  if (typeof req.query.__test === "string") {
    try {
      const t = String(req.query.__test);
      console.log(`[DEV TEST] __test=${t}`);

      const {
        notifyTransferInitiated,
        notifyTransferPaid,
        notifyTransferReversed,
      } = await import("../services/notifications/payments");

      const refId = process.env.TEST_REFID || "TEST-REFID-123";
      if (t === "transfer.created") {
        await notifyTransferInitiated({
          refId,
          amount: 12.34,
          currency: "usd",
          transferId: "tr_test_123",
          productName: "Test Product",
        });
      } else if (t === "transfer.updated") {
        await notifyTransferPaid({
          refId,
          amount: 12.34,
          currency: "usd",
          transferId: "tr_test_123",
        });
      } else if (t === "transfer.reversed") {
        await notifyTransferReversed({
          refId,
          amount: 12.34,
          currency: "usd",
          transferId: "tr_test_123",
          reversalId: "trr_test_001",
        });
      } else {
        return res.status(400).send("Unknown __test");
      }
      return res.status(200).send("dev test OK ✅");
    } catch (e: any) {
      console.error("[DEV TEST] error:", e?.message || e);
      return res.status(500).send("dev test error");
    }
  }
  // ───────────────────────────────────────────────────────────────
  console.log("🔔 Received webhook call...");
  // const sig = req.headers["stripe-signature"] as string | undefined;
  const isTest = typeof req.query.__test === "string";
  const ua = String(req.headers["user-agent"] || "");
  const isStripeUA = /^Stripe\//i.test(ua);

  // Allow Stripe + Stripe CLI only. Soft-ignore noise from random bots.
  // if (
  //   !sig ||
  //   !sig.includes("t=") ||
  //   !sig.includes("v1=") ||
  //   !/^Stripe\//i.test(ua)
  // ) {
  //   console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
  //   return res.status(200).send("ok");
  // }
  // AFTER
  // If it's not a test call, require Stripe UA (signature checked below)
  if (!isTest && !isStripeUA) {
    console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
    return res.status(200).send("ok");
  }

  let event: Stripe.Event;
  try {
    console.log("🔑 Verifying Stripe signature...");

    // Ensure signature is a single string
    const sigHeader = req.headers["stripe-signature"];
    if (!sigHeader || Array.isArray(sigHeader)) {
      return res.status(400).send("Missing Stripe signature");
    }

    // req.body must be the raw Buffer (ensure express.raw in server.ts)
    const rawBody: Buffer = (req as any).body;

    event = stripe.webhooks.constructEvent(rawBody, sigHeader, endpointSecret);
    console.log("✅ Signature verified.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logEventHeader(event);

  try {
    switch (event.type) {
      // ===================== ONBOARDING EVENTS =====================
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const ref = await (await import("../models/Affiliate")).default
          .findOne({ stripeAccountId: acct.id }, { refId: 1 })
          .lean();
        if (ref?.refId) {
          const due = acct.requirements?.currently_due ?? [];
          const complete =
            (acct.charges_enabled && acct.payouts_enabled) ||
            (due.length === 0 && acct.details_submitted);

          await recordState(ref.refId, complete ? "complete" : "in_progress");
          // (optional) log
          console.log(
            `[WH] account.updated → ${ref.refId} state=${
              complete ? "complete" : "in_progress"
            }`
          );
        }
        break;
      }

      case "account.application.deauthorized": {
        const accountId = (event.account as string) || "";
        const ref = await (await import("../models/Affiliate")).default
          .findOne({ stripeAccountId: accountId }, { refId: 1 })
          .lean();
        if (ref?.refId) {
          await handleDisconnect(ref.refId);
          console.log(`[WH] deauthorized → reset cycle for ${ref.refId}`);
        }
        break;
      }

      // --------- TRANSFERS (platform → connected account) ---------
      case "transfer.created": {
        const t = event.data.object as Stripe.Transfer;

        // Prefer matching by Payment.transferId (set when you initiated transfer)
        const payment = await Payment.findOne({ transferId: t.id });

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

        // Persist reversal id on Payment (if known)
        const payment = await Payment.findOne({ transferId: t.id });
        if (payment) {
          const firstReversal = t.reversals?.data?.[0];
          if (firstReversal?.id && !payment.reversalId) {
            payment.reversalId = firstReversal.id;
            payment.notes = [
              payment.notes,
              `Transfer reversed (${firstReversal.id})`,
            ]
              .filter(Boolean)
              .join(" | ");
            await payment.save();
          }
        }

        // Flip sales status to reversed if they were processing/paid under this transfer
        const saleFilter: any = payment
          ? { _id: { $in: payment.saleIds } }
          : { transferId: t.id };

        const upd = await AffiliateSale.updateMany(
          { ...saleFilter, commissionStatus: { $in: ["processing", "paid"] } },
          { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
        );

        console.log(
          `[WH] transfer.reversed tr=${t.id} amount=${(t.amount / 100).toFixed(
            2
          )} ${t.currency} → sales set to reversed: modified=${
            (upd as any).modifiedCount ?? (upd as any).nModified
          }`
        );
        break;
      }

      case "transfer.updated": {
        const t = event.data.object as Stripe.Transfer;
        console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
        // Optional: sync metadata/description to a Payment.notes if desired
        break;
      }

      // --------- PAYOUTS (connected account → bank) ---------
      // We flip PROCESSING → PAID only when the payout is actually paid.
      case "payout.created":
      case "payout.updated":
      case "payout.canceled":
      case "payout.failed":
      case "payout.paid": {
        const p = event.data.object as Stripe.Payout;
        const acctId = (event.account as string) || "";
        const lastAt = p.arrival_date
          ? new Date(p.arrival_date * 1000)
          : new Date();

        // ✅ Mark PAID when it really paid
        if (
          event.type === "payout.paid" ||
          (event.type === "payout.updated" && p.status === "paid")
        ) {
          const upd = await AffiliateSale.updateMany(
            { stripeAccountId: acctId, commissionStatus: "processing" },
            {
              $set: {
                commissionStatus: "paid",
                payoutStatus: "paid",
                paidAt: new Date(),
                payoutId: p.id,
                lastPayoutId: p.id,
                lastPayoutAt: lastAt,
              },
            }
          );
          console.log(
            `[WH] payout → processing→paid: modified=${
              (upd as any).modifiedCount ?? (upd as any).nModified
            }`
          );
        }

        // ❗️Failed/Cancelled — show it, but allow retry
        if (
          event.type === "payout.failed" ||
          event.type === "payout.canceled"
        ) {
          const status = event.type === "payout.failed" ? "failed" : "canceled";
          const upd = await AffiliateSale.updateMany(
            { stripeAccountId: acctId, commissionStatus: "processing" },
            {
              $set: {
                commissionStatus: "unpaid", // enable retry
                payoutStatus: status, // UI chip shows Failed/Canceled
                lastPayoutId: p.id,
                lastPayoutAt: lastAt,
                payoutFailureCode: p.failure_code || undefined,
                payoutFailureMessage: p.failure_message || undefined,
              },
              $unset: { paidAt: 1, payoutId: 1 }, // this attempt didn’t pay out
            }
          );
          console.log(
            `[WH] payout ${status} → processing→unpaid: modified=${
              (upd as any).modifiedCount ?? (upd as any).nModified
            }`
          );
        }
        break;
      }

      // ===================== REFUND EVENTS (CUSTOMER-LEVEL) =====================
      case "refund.created":
      case "refund.updated":
      case "refund.failed": {
        const r = event.data.object as Stripe.Refund;
        await processRefund(r, event.type); // processRefund will look at r.status
        break;
      }

      // Optional umbrella event
      case "charge.refunded": {
        const c = event.data.object as Stripe.Charge;
        const pseudoRefund = {
          id: `charge_ref_${c.id}`,
          amount: c.amount_refunded,
          currency: c.currency,
          charge: c.id,
          payment_intent: c.payment_intent,
          status: "succeeded",
          metadata: c.metadata || {},
        } as unknown as Stripe.Refund;
        await processRefund(pseudoRefund, "charge.refunded");
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
 * - Only sets sale.refundStatus on "succeeded"
 * - Only increments refundTotal on "succeeded"
 * - Sets commissionStatus="reversed" if the sale had been paid; else "unpaid"
 */
async function processRefund(refund: Stripe.Refund, source: string) {
  const refundId = refund.id; // rf_... (or synthetic for charge.refunded)
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
  const proportion =
    saleAmount > 0 ? Math.min(1, refundAmount / saleAmount) : 0;

  // --- BEGIN: notify affiliate on succeeded refunds (added; uses existing logic/vars) ---
  if (status === "succeeded") {
    const isFull = proportion >= 0.999;

    // Resolve refId to target the correct affiliate
    let refId: string | undefined =
      (sale as any).refId ||
      (await (async () => {
        const aff = (sale as any).affiliateId
          ? await Affiliate.findById((sale as any).affiliateId).lean()
          : null;
        return aff?.refId;
      })());

    if (refId) {
      await notifyRefundSucceeded({
        refId,
        refundId,
        amount: refundAmount,
        currency,
        isFull,
      });
    }
  }
  // --- END: notify affiliate on succeeded refunds ---

  // Upsert/append refund record on the sale
  const existingIdx = Array.isArray((sale as any).refunds)
    ? (sale as any).refunds.findIndex((r: any) => r.id === refundId)
    : -1;

  if (existingIdx >= 0) {
    const setObj: any = {};
    setObj[`refunds.${existingIdx}.status`] = status;
    setObj[`refunds.${existingIdx}.amount`] = refundAmount;
    setObj[`refunds.${existingIdx}.updatedAt`] = new Date();

    // Only set top-level refundStatus when succeeded
    if (status === "succeeded") {
      const topLevel = statusMapToSaleRefundStatus(proportion);
      setObj["refundStatus"] = topLevel;
      setObj["refundedAt"] = new Date();
      // commissionStatus
      const wasPaid =
        (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt;
      setObj["commissionStatus"] = wasPaid ? "reversed" : "unpaid";
      // increment total refunded
      await AffiliateSale.updateOne(
        { _id: (sale as any)._id },
        { $set: setObj, $inc: { refundTotal: refundAmount } }
      );
    } else {
      await AffiliateSale.updateOne(
        { _id: (sale as any)._id },
        { $set: setObj }
      );
    }

    console.log("[REFUND] Updated existing refund record on sale.");
    return;
  }

  // New refund record
  const pushRefund = {
    id: refundId,
    amount: refundAmount,
    status,
    createdAt: new Date(),
  };

  const saleUpdate: any = {
    $push: { refunds: pushRefund },
  };

  if (status === "succeeded") {
    saleUpdate.$set = {
      refundStatus: statusMapToSaleRefundStatus(proportion),
      refundedAt: new Date(),
      // commissionStatus depends on whether funds had been paid already
      commissionStatus:
        (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt
          ? "reversed"
          : "unpaid",
    };
    saleUpdate.$inc = { refundTotal: refundAmount };
  }

  await AffiliateSale.updateOne({ _id: (sale as any)._id }, saleUpdate);

  console.log(
    `[REFUND] Sale ${String((sale as any)._id)} ` +
      (status === "succeeded"
        ? `marked refund ${saleUpdate.$set.refundStatus}; commissionStatus=${saleUpdate.$set.commissionStatus}`
        : `recorded refund status=${status} (no state flip yet)`)
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
  if (chargeId)
    or.push({ stripeChargeId: chargeId, paymentIntentId: chargeId }); // (kept as-is)
  if (piId) or.push({ stripePaymentIntentId: piId, paymentIntentId: piId }); // (kept as-is)
  if (orderId) or.push({ orderId: String(orderId) });

  if (!or.length) return null;

  if (maybeObjectId) {
    const byId = await AffiliateSale.findById(maybeObjectId).lean();
    if (byId) return byId;
  }

  // Try any of the above possibilities
  const sale = await AffiliateSale.findOne({ $or: or }).lean();
  return sale;
}

// Map to enum-friendly top-level refund status
function statusMapToSaleRefundStatus(proportion: number): "full" | "partial" {
  const isFull = proportion >= 0.999;
  return isFull ? "full" : "partial";
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

function mapStripeAccountToState(
  acct: Stripe.Account | null
): "not_started" | "in_progress" | "complete" {
  if (!acct) return "not_started";
  const due = acct.requirements?.currently_due ?? [];
  const complete =
    (acct.charges_enabled && acct.payouts_enabled) ||
    (due.length === 0 && acct.details_submitted);
  return complete ? "complete" : "in_progress";
}

// // src/routes/stripeWebhook.ts
// import { Request, Response } from "express";
// import Stripe from "stripe";
// import { Types } from "mongoose";
// import AffiliateSale from "../models/AffiliateSale";
// import Payment from "../models/Payment";
// import {
//   handleDisconnect,
//   recordState,
// } from "../services/notifications/onboarding";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// // IMPORTANT (server.ts):
// // app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// export default async function stripeWebhook(req: Request, res: Response) {
//   console.log("🔔 Received webhook call...");
//   const sig = req.headers["stripe-signature"] as string | undefined;
//   const ua = String(req.headers["user-agent"] || "");

//   // Allow Stripe + Stripe CLI only. Soft-ignore noise from random bots.
//   if (
//     !sig ||
//     !sig.includes("t=") ||
//     !sig.includes("v1=") ||
//     !/^Stripe\//i.test(ua)
//   ) {
//     console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
//     return res.status(200).send("ok");
//   }

//   let event: Stripe.Event;
//   try {
//     console.log("🔑 Verifying Stripe signature...");
//     // NOTE: req.body must be the raw Buffer (see server.ts)
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     console.log("✅ Signature verified.");
//   } catch (err: any) {
//     console.error("❌ Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   logEventHeader(event);

//   try {
//     switch (event.type) {
//       // ===================== ONBOARDING EVENTS =====================
//       case "account.updated": {
//         const acct = event.data.object as Stripe.Account;
//         const ref = await (await import("../models/Affiliate")).default
//           .findOne({ stripeAccountId: acct.id }, { refId: 1 })
//           .lean();
//         if (ref?.refId) {
//           const due = acct.requirements?.currently_due ?? [];
//           const complete =
//             (acct.charges_enabled && acct.payouts_enabled) ||
//             (due.length === 0 && acct.details_submitted);

//           await recordState(ref.refId, complete ? "complete" : "in_progress");
//           // (optional) log
//           console.log(
//             `[WH] account.updated → ${ref.refId} state=${
//               complete ? "complete" : "in_progress"
//             }`
//           );
//         }
//         break;
//       }

//       case "account.application.deauthorized": {
//         const accountId = (event.account as string) || "";
//         const ref = await (await import("../models/Affiliate")).default
//           .findOne({ stripeAccountId: accountId }, { refId: 1 })
//           .lean();
//         if (ref?.refId) {
//           await handleDisconnect(ref.refId);
//           console.log(`[WH] deauthorized → reset cycle for ${ref.refId}`);
//         }
//         break;
//       }

//       // --------- TRANSFERS (platform → connected account) ---------
//       case "transfer.created": {
//         const t = event.data.object as Stripe.Transfer;

//         // Prefer matching by Payment.transferId (set when you initiated transfer)
//         const payment = await Payment.findOne({ transferId: t.id });

//         const saleFilter: any = payment
//           ? { _id: { $in: payment.saleIds } }
//           : { transferId: t.id };

//         const upd = await AffiliateSale.updateMany(saleFilter, {
//           $set: {
//             commissionStatus: "processing",
//             transferId: t.id,
//             stripeAccountId: String(t.destination || ""),
//             processingAt: new Date(),
//           },
//         });

//         console.log(
//           `[WH] transfer.created → set processing: matched=${
//             (upd as any).matchedCount ?? (upd as any).n
//           }, modified=${(upd as any).modifiedCount ?? (upd as any).nModified}`
//         );
//         break;
//       }

//       case "transfer.reversed": {
//         const t = event.data.object as Stripe.Transfer;

//         // Persist reversal id on Payment (if known)
//         const payment = await Payment.findOne({ transferId: t.id });
//         if (payment) {
//           const firstReversal = t.reversals?.data?.[0];
//           if (firstReversal?.id && !payment.reversalId) {
//             payment.reversalId = firstReversal.id;
//             payment.notes = [
//               payment.notes,
//               `Transfer reversed (${firstReversal.id})`,
//             ]
//               .filter(Boolean)
//               .join(" | ");
//             await payment.save();
//           }
//         }

//         // Flip sales status to reversed if they were processing/paid under this transfer
//         const saleFilter: any = payment
//           ? { _id: { $in: payment.saleIds } }
//           : { transferId: t.id };

//         const upd = await AffiliateSale.updateMany(
//           { ...saleFilter, commissionStatus: { $in: ["processing", "paid"] } },
//           { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
//         );

//         console.log(
//           `[WH] transfer.reversed tr=${t.id} amount=${(t.amount / 100).toFixed(
//             2
//           )} ${t.currency} → sales set to reversed: modified=${
//             (upd as any).modifiedCount ?? (upd as any).nModified
//           }`
//         );
//         break;
//       }

//       case "transfer.updated": {
//         const t = event.data.object as Stripe.Transfer;
//         console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
//         // Optional: sync metadata/description to a Payment.notes if desired
//         break;
//       }

//       // --------- PAYOUTS (connected account → bank) ---------
//       // We flip PROCESSING → PAID only when the payout is actually paid.
//       case "payout.created":
//       case "payout.updated":
//       case "payout.canceled":
//       case "payout.failed":
//       case "payout.paid": {
//         const p = event.data.object as Stripe.Payout;
//         const acctId = (event.account as string) || "";
//         const lastAt = p.arrival_date
//           ? new Date(p.arrival_date * 1000)
//           : new Date();

//         // ✅ Mark PAID when it really paid
//         if (
//           event.type === "payout.paid" ||
//           (event.type === "payout.updated" && p.status === "paid")
//         ) {
//           const upd = await AffiliateSale.updateMany(
//             { stripeAccountId: acctId, commissionStatus: "processing" },
//             {
//               $set: {
//                 commissionStatus: "paid",
//                 payoutStatus: "paid",
//                 paidAt: new Date(),
//                 payoutId: p.id,
//                 lastPayoutId: p.id,
//                 lastPayoutAt: lastAt,
//               },
//             }
//           );
//           console.log(
//             `[WH] payout → processing→paid: modified=${
//               (upd as any).modifiedCount ?? (upd as any).nModified
//             }`
//           );
//         }

//         // ❗️Failed/Cancelled — show it, but allow retry
//         if (
//           event.type === "payout.failed" ||
//           event.type === "payout.canceled"
//         ) {
//           const status = event.type === "payout.failed" ? "failed" : "canceled";
//           const upd = await AffiliateSale.updateMany(
//             { stripeAccountId: acctId, commissionStatus: "processing" },
//             {
//               $set: {
//                 commissionStatus: "unpaid", // enable retry
//                 payoutStatus: status, // UI chip shows Failed/Canceled
//                 lastPayoutId: p.id,
//                 lastPayoutAt: lastAt,
//                 payoutFailureCode: p.failure_code || undefined,
//                 payoutFailureMessage: p.failure_message || undefined,
//               },
//               $unset: { paidAt: 1, payoutId: 1 }, // this attempt didn’t pay out
//             }
//           );
//           console.log(
//             `[WH] payout ${status} → processing→unpaid: modified=${
//               (upd as any).modifiedCount ?? (upd as any).nModified
//             }`
//           );
//         }
//         break;
//       }

//       // ===================== REFUND EVENTS (CUSTOMER-LEVEL) =====================
//       case "refund.created":
//       case "refund.updated":
//       case "refund.failed": {
//         const r = event.data.object as Stripe.Refund;
//         await processRefund(r, event.type); // processRefund will look at r.status
//         break;
//       }

//       // Optional umbrella event
//       case "charge.refunded": {
//         const c = event.data.object as Stripe.Charge;
//         const pseudoRefund = {
//           id: `charge_ref_${c.id}`,
//           amount: c.amount_refunded,
//           currency: c.currency,
//           charge: c.id,
//           payment_intent: c.payment_intent,
//           status: "succeeded",
//           metadata: c.metadata || {},
//         } as unknown as Stripe.Refund;
//         await processRefund(pseudoRefund, "charge.refunded");
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

// /**
//  * Core refund processor.
//  * - Only sets sale.refundStatus on "succeeded"
//  * - Only increments refundTotal on "succeeded"
//  * - Sets commissionStatus="reversed" if the sale had been paid; else "unpaid"
//  */
// async function processRefund(refund: Stripe.Refund, source: string) {
//   const refundId = refund.id; // rf_... (or synthetic for charge.refunded)
//   const currency = refund.currency;
//   const refundAmount = Number(refund.amount || 0) / 100;
//   const chargeId =
//     typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
//   const piId =
//     typeof refund.payment_intent === "string"
//       ? refund.payment_intent
//       : (refund.payment_intent as any)?.id;
//   const status = refund.status || "unknown";

//   console.log(
//     `[REFUND] ${source} rf=${refundId} charge=${chargeId ?? "-"} pi=${
//       piId ?? "-"
//     } ` + `amount=${refundAmount.toFixed(2)} ${currency} status=${status}`
//   );

//   const sale = await findAffiliateSaleForRefund(refund);
//   if (!sale) {
//     console.warn(
//       "[REFUND] No AffiliateSale matched this refund. Metadata:",
//       refund.metadata
//     );
//     return;
//   }

//   const saleAmount = Number(
//     (sale as any).amount ?? (sale as any).saleAmount ?? 0
//   );
//   const proportion =
//     saleAmount > 0 ? Math.min(1, refundAmount / saleAmount) : 0;

//   // Upsert/append refund record on the sale
//   const existingIdx = Array.isArray((sale as any).refunds)
//     ? (sale as any).refunds.findIndex((r: any) => r.id === refundId)
//     : -1;

//   if (existingIdx >= 0) {
//     const setObj: any = {};
//     setObj[`refunds.${existingIdx}.status`] = status;
//     setObj[`refunds.${existingIdx}.amount`] = refundAmount;
//     setObj[`refunds.${existingIdx}.updatedAt`] = new Date();

//     // Only set top-level refundStatus when succeeded
//     if (status === "succeeded") {
//       const topLevel = statusMapToSaleRefundStatus(proportion);
//       setObj["refundStatus"] = topLevel;
//       setObj["refundedAt"] = new Date();
//       // commissionStatus
//       const wasPaid =
//         (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt;
//       setObj["commissionStatus"] = wasPaid ? "reversed" : "unpaid";
//       // increment total refunded
//       await AffiliateSale.updateOne(
//         { _id: (sale as any)._id },
//         { $set: setObj, $inc: { refundTotal: refundAmount } }
//       );
//     } else {
//       await AffiliateSale.updateOne(
//         { _id: (sale as any)._id },
//         { $set: setObj }
//       );
//     }

//     console.log("[REFUND] Updated existing refund record on sale.");
//     return;
//   }

//   // New refund record
//   const pushRefund = {
//     id: refundId,
//     amount: refundAmount,
//     status,
//     createdAt: new Date(),
//   };

//   const saleUpdate: any = {
//     $push: { refunds: pushRefund },
//   };

//   if (status === "succeeded") {
//     saleUpdate.$set = {
//       refundStatus: statusMapToSaleRefundStatus(proportion),
//       refundedAt: new Date(),
//       // commissionStatus depends on whether funds had been paid already
//       commissionStatus:
//         (sale as any).commissionStatus === "paid" || !!(sale as any).paidAt
//           ? "reversed"
//           : "unpaid",
//     };
//     saleUpdate.$inc = { refundTotal: refundAmount };
//   }

//   await AffiliateSale.updateOne({ _id: (sale as any)._id }, saleUpdate);

//   console.log(
//     `[REFUND] Sale ${String((sale as any)._id)} ` +
//       (status === "succeeded"
//         ? `marked refund ${saleUpdate.$set.refundStatus}; commissionStatus=${saleUpdate.$set.commissionStatus}`
//         : `recorded refund status=${status} (no state flip yet)`)
//   );
// }

// async function findAffiliateSaleForRefund(refund: Stripe.Refund) {
//   const meta = refund.metadata || {};
//   const saleId = meta.affiliateSaleId || meta.saleId;
//   const maybeObjectId =
//     saleId && Types.ObjectId.isValid(saleId)
//       ? new Types.ObjectId(saleId)
//       : null;

//   const chargeId =
//     typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
//   const piId =
//     typeof refund.payment_intent === "string"
//       ? refund.payment_intent
//       : (refund.payment_intent as any)?.id;

//   const orderId =
//     meta.woo_order_id ||
//     meta.order_id ||
//     meta.orderId ||
//     meta.woocommerce_order_id;

//   const or: any[] = [];
//   if (maybeObjectId) or.push({ _id: maybeObjectId });
//   if (chargeId)
//     or.push({ stripeChargeId: chargeId, paymentIntentId: chargeId }); // try both fields
//   if (piId) or.push({ stripePaymentIntentId: piId, paymentIntentId: piId });
//   if (orderId) or.push({ orderId: String(orderId) });

//   if (!or.length) return null;

//   if (maybeObjectId) {
//     const byId = await AffiliateSale.findById(maybeObjectId).lean();
//     if (byId) return byId;
//   }

//   // Try any of the above possibilities
//   const sale = await AffiliateSale.findOne({ $or: or }).lean();
//   return sale;
// }

// // Map to enum-friendly top-level refund status
// function statusMapToSaleRefundStatus(proportion: number): "full" | "partial" {
//   const isFull = proportion >= 0.999;
//   return isFull ? "full" : "partial";
// }

// function logEventHeader(event: Stripe.Event) {
//   const acct = event.account ? ` acct=${event.account}` : "";
//   console.log(`[WH] ▶︎ Event id=${event.id} type=${event.type}${acct}`);
// }

// function iso(unixSeconds?: number) {
//   return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : "n/a";
// }

// function round2(n: number) {
//   return Math.round((n + Number.EPSILON) * 100) / 100;
// }

// function mapStripeAccountToState(
//   acct: Stripe.Account | null
// ): "not_started" | "in_progress" | "complete" {
//   if (!acct) return "not_started";
//   const due = acct.requirements?.currently_due ?? [];
//   const complete =
//     (acct.charges_enabled && acct.payouts_enabled) ||
//     (due.length === 0 && acct.details_submitted);
//   return complete ? "complete" : "in_progress";
// }
