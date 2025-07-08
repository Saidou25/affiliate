import { stripe } from "./stripe";

export async function checkStripeAccountStatus(stripeAccountId: string) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const status = {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    };

    console.log("✅ Stripe account status:", status);

    if (!account.charges_enabled || !account.payouts_enabled) {
      console.log("Affiliate is not fully onboarded or payouts are disabled.");
    }

    return {
      success: true,
      ...status,
    };
  } catch (err: any) {
    console.log("❌ Failed to check account status:", err.message);
    return {
      success: false,
      id: stripeAccountId,
      message: err.message,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    };
  }
}
