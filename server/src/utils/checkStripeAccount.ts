import { stripe } from "./stripe";

export async function checkStripeAccountStatus(stripeAccountId: string) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);

    console.log("Stripe account status:", {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error(
        "Affiliate is not fully onboarded or payouts are disabled."
      );
    }

    return {
      success: true,
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    };
  } catch (err: any) {
    console.error("❌ Failed to check account status:", err.message);
    return { success: false, message: err.message };
  }
}
