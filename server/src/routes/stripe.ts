// server/routes/stripe.ts
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Call this function from your API route or GraphQL resolver
export async function createStripeAccountAndOnboardingLink(
  affiliateId: string
) {
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

  // TODO: Save account.id to your MongoDB Affiliate document (stripeAccountId)
  return { onboardingUrl: link.url, stripeAccountId: account.id };
}
