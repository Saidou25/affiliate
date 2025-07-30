import express, { Request, Response } from "express";
import Stripe from "stripe";
import fetch from "node-fetch";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // ✅ raw body for signature validation
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Handle successful checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        // Extract data
        const refId = session.metadata?.affiliateRefId || "";
        const buyerEmail = session.customer_email || "";
        const amount = session.amount_total
          ? Math.round(session.amount_total / 100)
          : 0;

        // ✅ Fetch line items for the title
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const title = lineItems.data[0]?.description || "Purchase";

        console.log("🔑 Affiliate data from webhook:", { refId, buyerEmail, amount, title });

        if (refId) {
          // ✅ Call GraphQL mutation to save affiliate sale
          const graphqlResponse = await fetch(
            process.env.AFFILIATE_SERVER_URL || "https://affiliate-2yj9.onrender.com/graphql",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation TrackAffiliateSale(
                    $refId: String!,
                    $title: String,
                    $buyerEmail: String,
                    $amount: Int
                  ) {
                    trackAffiliateSale(
                      refId: $refId,
                      title: $title,
                      buyerEmail: $buyerEmail,
                      amount: $amount
                    ) {
                      id
                      refId
                      title
                      commissionEarned
                      commissionStatus
                    }
                  }
                `,
                variables: { refId, title, buyerEmail, amount },
              }),
            }
          );

          const data = await graphqlResponse.json();
          console.log("✅ Affiliate sale saved via GraphQL:", data);
        }
      } catch (err) {
        console.error("❌ Error processing affiliate sale:", err);
      }
    }

    res.status(200).send("✅ Webhook processed");
  }
);

export default router;
