import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // No need for apiVersion if using latest Stripe SDK
});

export async function createStripeAccountAndOnboardingLink(affiliateId: string) {
  const account = await stripe.accounts.create({
    type: "express",
    metadata: { affiliateId },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "http://localhost:5173/stripe-onboarding/refresh",
    return_url: "http://localhost:5173/stripe-onboarding/return",
    type: "account_onboarding",
  });

  return { onboardingUrl: link.url, stripeAccountId: account.id };
}
