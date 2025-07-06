import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create a new Stripe Express account + onboarding link
export async function createStripeAccountAndOnboardingLink(
  affiliateId: string
) {
  const account = await stripe.accounts.create({
    type: "express",
    metadata: { affiliateId },
    capabilities: {
      transfers: { requested: true }, // ✅ required for payouts
    },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "http://localhost:5173/stripe-onboarding/refresh",
    return_url: "http://localhost:5173/stripe-onboarding/return",
    type: "account_onboarding",
  });

  return { onboardingUrl: link.url, stripeAccountId: account.id };
}

// Check the account status
export const checkStripeAccountStatus = async (stripeAccountId: string) => {
  const account = await stripe.accounts.retrieve(stripeAccountId);

  if (!account?.id) {
    throw new Error("Stripe account not found or invalid.");
  }
  return {
    id: account.id || "",
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  };
};

// Re-send onboarding link for incomplete accounts
export const getOnboardingLinkForExistingAccount = async (
  stripeAccountId: string
) => {
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: "http://localhost:5173/stripe-onboarding/refresh",
    return_url: "http://localhost:5173/stripe-onboarding/return",
    type: "account_onboarding",
  });

  return link.url;
};
