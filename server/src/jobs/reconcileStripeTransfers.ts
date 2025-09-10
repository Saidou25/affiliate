// import Stripe from "stripe";
// import Payment from "../models/Payment";
// import AffiliateSale from "../models/AffiliateSale";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// /**
//  * Reconcile Stripe transfers with local Payment + AffiliateSale records.
//  * - Confirms transfer existence (source of truth = Stripe)
//  * - processing → paid when transfer exists and not reversed
//  * - processing → reversed when transfer is reversed
//  * - Idempotent: safe to run repeatedly
//  */
// export async function reconcileStripeTransfers(sinceHours = 48) {
//   const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

//   // Narrow to recent, Stripe-originated payments
//   const candidates = await Payment.find({
//     method: "stripe_transfer",
//     createdAt: { $gte: cutoff },
//     transactionId: { $regex: /^tr_/ }, // only Stripe transfers
//   }).lean();


//   for (const p of candidates) {
//     try {
//       const tr = await stripe.transfers.retrieve(p.transactionId);
//       const tr = await stripe.transfers.retrieve(p.transactionId);
//       const paidAt = new Date(tr.created * 1000);

//       if (tr.reversed) {
//         // mark related sales reversed (only ones not already reversed)
//         await AffiliateSale.updateMany(
//           { _id: { $in: p.saleIds }, commissionStatus: { $ne: "reversed" } },
//           {
//             $set: {
//               commissionStatus: "reversed",
//               paidAt: undefined,
//               paymentId: p._id,
//             },
//           }
//         );

//         // optional: reflect reversal in Payment doc for reporting
//         await Payment.updateOne(
//           { _id: p._id },
//           {
//             $set: {
//               status: "transfer_reversed",
//               transferId: tr.id,
//               balanceTransactionId: String(tr.balance_transaction ?? ""),
//               currency: tr.currency,
//             },
//           }
//         );
//         continue;
//       }

//       // Transfer exists and is not reversed → mark sales paid
//       await AffiliateSale.updateMany(
//         {
//           _id: { $in: p.saleIds },
//           commissionStatus: { $in: ["unpaid", "processing"] },
//         },
//         {
//           $set: {
//             commissionStatus: "paid",
//             paidAt,
//             paymentId: p._id,
//           },
//         }
//       );

//       // Enrich Payment with Stripe-confirmed details (safe to repeat)
//       await Payment.updateOne(
//         { _id: p._id },
//         {
//           $set: {
//             status: "transfer_created",
//             transferId: tr.id,
//             balanceTransactionId: String(tr.balance_transaction ?? ""),
//             currency: tr.currency,
//             // keep paidCommission/saleAmount as recorded
//           },
//         }
//       );
//     } catch (err: any) {
//       // If the transfer was never found (e.g., bad id), log and continue
//       console.warn(
//         `[reconcile] transfer retrieve failed for Payment ${p._id} (${p.transactionId}):`,
//         err?.message || err
//       );
//     }
//   }
// }

import Stripe from "stripe";
import Payment from "../models/Payment";
import AffiliateSale from "../models/AffiliateSale";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Reconcile Stripe transfers with local Payment + AffiliateSale records.
 * - Confirms transfer existence (source of truth = Stripe)
 * - processing → paid when transfer exists and not reversed
 * - processing → reversed when transfer is reversed
 * - Idempotent: safe to run repeatedly
 */
export async function reconcileStripeTransfers(sinceHours = 48) {
  const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  // Narrow to recent, Stripe-originated payments
  const candidates = await Payment.find({
    method: "stripe_transfer",
    createdAt: { $gte: cutoff },
    transactionId: { $regex: /^tr_/ }, // only Stripe transfers
  }).lean();

  for (const p of candidates) {
    try {
      // Type-safe narrowing: ensure we have a definite Stripe transfer id
      const txId = typeof p.transactionId === "string" ? p.transactionId : undefined;
      if (!txId || !txId.startsWith("tr_")) {
        // Not a Stripe transfer id (manual/bank/null) → skip
        continue;
      }

      const tr = await stripe.transfers.retrieve(txId);
      const paidAt = new Date(tr.created * 1000);

      if (tr.reversed) {
        // Mark related sales reversed (only ones not already reversed)
        await AffiliateSale.updateMany(
          { _id: { $in: p.saleIds }, commissionStatus: { $ne: "reversed" } },
          {
            $set: {
              commissionStatus: "reversed",
              paidAt: undefined,
              paymentId: p._id,
            },
          }
        );

        // Optional: reflect reversal in Payment doc for reporting
        // (Ensure your Payment schema allows these fields, or remove them.)
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
        continue;
      }

      // Transfer exists and is not reversed → mark sales paid
      await AffiliateSale.updateMany(
        {
          _id: { $in: p.saleIds },
          commissionStatus: { $in: ["unpaid", "processing"] },
        },
        {
          $set: {
            commissionStatus: "paid",
            paidAt,
            paymentId: p._id,
          },
        }
      );

      // Enrich Payment with Stripe-confirmed details (safe to repeat)
      // (Ensure your Payment schema allows these fields, or remove them.)
      await Payment.updateOne(
        { _id: p._id },
        {
          $set: {
            status: "transfer_created",
            transferId: tr.id,
            balanceTransactionId: String(tr.balance_transaction ?? ""),
            currency: tr.currency,
          },
        }
      );
    } catch (err: any) {
      // If the transfer was never found (e.g., bad id), log and continue
      console.warn(
        `[reconcile] transfer retrieve failed for Payment ${p._id} (${p.transactionId}):`,
        err?.message || err
      );
    }
  }
}
