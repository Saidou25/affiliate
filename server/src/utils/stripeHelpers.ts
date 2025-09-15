// src/lib/stripeHelpers.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export function dollarsToCents(n?: number | null) {
  if (!n || !Number.isFinite(n)) return undefined;
  return Math.round(n * 100);
}

export function pickRefundTarget(sale: any) {
  // Prefer explicit charge id if you have it
  if (sale.stripeChargeId && sale.stripeChargeId.startsWith("ch_")) {
    return { charge: sale.stripeChargeId };
  }
  // Fall back to stored PI fields
  const pi = sale.stripePaymentIntentId?.startsWith("pi_")
    ? sale.stripePaymentIntentId
    : sale.paymentIntentId?.startsWith("pi_")
    ? sale.paymentIntentId
    : null;

  if (pi) return { payment_intent: pi };

  // legacy: sometimes paymentIntentId was a charge id
  if (sale.paymentIntentId?.startsWith("ch_")) {
    return { charge: sale.paymentIntentId };
  }

  return null;
}
