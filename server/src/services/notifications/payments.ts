import { Types } from "mongoose";
import Affiliate from "../../models/Affiliate";

function money(n: number, currency = "usd") {
  // keep this simple & consistent with your UI
  const v = Math.round((n + Number.EPSILON) * 100) / 100;
  return `${v.toFixed(2)} ${String(currency).toUpperCase()}`;
}

/**
 * Idempotent push: dedupe by exact (title + text).
 * We embed the stable Stripe id (tr_... / rf_...) in text so this is reliable.
 */
async function createNoticeIfMissing(refId: string, title: string, text: string) {
  const exists = await Affiliate.exists({
    refId,
    notifications: { $elemMatch: { title, text } },
  });
  if (exists) return;

  const oid = new Types.ObjectId();
  await Affiliate.updateOne(
    { refId },
    {
      $push: {
        notifications: {
          _id: oid,
          id: oid.toString(),
          title,
          text,
          read: false,
          date: new Date(),
        },
      },
    }
  );
}

/** When you create a transfer (platform → connected account) */
export async function notifyTransferInitiated(params: {
  refId: string;
  amount: number;           // dollars
  currency?: string;        // e.g. "usd"
  transferId: string;       // tr_...
  productName?: string | null;
}) {
  const { refId, amount, currency = "usd", transferId, productName } = params;
  const title = "Commission payout initiated";
  const text =
    `We created a transfer of ${money(amount, currency)}` +
    (productName ? ` for “${productName}”` : "") +
    ` (${transferId}).`;
  await createNoticeIfMissing(refId, title, text);
}

/** When reconcile confirms the transfer as paid (not reversed) */
export async function notifyTransferPaid(params: {
  refId: string;
  amount: number;
  currency?: string;
  transferId: string; // tr_...
}) {
  const { refId, amount, currency = "usd", transferId } = params;
  const title = "Commission payout completed";
  const text = `Stripe confirmed your commission payout ${money(amount, currency)} (${transferId}).`;
  await createNoticeIfMissing(refId, title, text);
}

/** When a transfer is reversed */
export async function notifyTransferReversed(params: {
  refId: string;
  amount: number;
  currency?: string;
  transferId: string;     // tr_...
  reversalId?: string;    // trr_... (optional)
}) {
  const { refId, amount, currency = "usd", transferId, reversalId } = params;
  const title = "Commission payout reversed";
  const tail = reversalId ? ` reversal=${reversalId}` : "";
  const text = `Stripe reversed a previous commission payout ${money(amount, currency)} (${transferId}).${tail ? ` (${tail})` : ""}`;
  await createNoticeIfMissing(refId, title, text);
}

/** When a customer refund succeeds (commission is adjusted) */
export async function notifyRefundSucceeded(params: {
  refId: string;
  refundId: string;       // rf_... or synthetic
  amount: number;         // dollars
  currency?: string;
  isFull: boolean;
}) {
  const { refId, refundId, amount, currency = "usd", isFull } = params;
  const title = isFull
    ? "Customer refund processed (full)"
    : "Customer refund processed (partial)";
  const text =
    `${isFull ? "A full refund" : "A partial refund"} of ${money(amount, currency)} was processed. ` +
    `Your commission was adjusted accordingly. (${refundId})`;
  await createNoticeIfMissing(refId, title, text);
}
