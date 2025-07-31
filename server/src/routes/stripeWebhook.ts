// import express, { Request, Response } from "express";
// import Stripe from "stripe";
// import fetch from "node-fetch";

// const router = express.Router();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }), // ✅ raw body for signature validation
//   async (req: Request, res: Response) => {
//     const sig = req.headers["stripe-signature"] as string;

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err: any) {
//       console.error("❌ Webhook signature verification failed.", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // ✅ Handle successful checkout
//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object as Stripe.Checkout.Session;

//       try {
//         // Extract data
//         const refId = session.metadata?.affiliateRefId || "";
//         const buyerEmail = session.customer_email || "";
//         const amount = session.amount_total
//           ? Math.round(session.amount_total / 100)
//           : 0;

//         // ✅ Fetch line items for the title
//         const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
//         const title = lineItems.data[0]?.description || "Purchase";

//         console.log("🔑 Affiliate data from webhook:", { refId, buyerEmail, amount, title });

//         if (refId) {
//           // ✅ Call GraphQL mutation to save affiliate sale
//           const graphqlResponse = await fetch(
//             process.env.AFFILIATE_SERVER_URL || "https://affiliate-2yj9.onrender.com/graphql",
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 query: `
//                   mutation TrackAffiliateSale(
//                     $refId: String!,
//                     $title: String,
//                     $buyerEmail: String,
//                     $amount: Int
//                   ) {
//                     trackAffiliateSale(
//                       refId: $refId,
//                       title: $title,
//                       buyerEmail: $buyerEmail,
//                       amount: $amount
//                     ) {
//                       id
//                       refId
//                       title
//                       commissionEarned
//                       commissionStatus
//                     }
//                   }
//                 `,
//                 variables: { refId, title, buyerEmail, amount },
//               }),
//             }
//           );

//           const data = await graphqlResponse.json();
//           console.log("✅ Affiliate sale saved via GraphQL:", data);
//         }
//       } catch (err) {
//         console.error("❌ Error processing affiliate sale:", err);
//       }
//     }

//     res.status(200).send("✅ Webhook processed");
//   }
// );

// export default router;








// import { Request, Response } from "express";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// export default async function stripeWebhook(req: Request, res: Response) {
//   const sig = req.headers["stripe-signature"] as string;

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err: any) {
//     console.error("❌ Webhook signature verification failed.", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     console.log("✅ Checkout session completed:", event.data.object);
//     // Handle affiliate tracking or other logic
//   }

//   res.json({ received: true });
// }









import { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Incoming Stripe webhook...");

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  // ✅ 1. Verify signature
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`✅ Webhook verified: ${event.type}`);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ 2. Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("🟢 Checkout session completed:", session.id);

    try {
      // ✅ 3. Retrieve full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });

      console.log("🔎 Full session retrieved");

      if (fullSession.line_items) {
        console.log(
          `🛒 Total items purchased: ${fullSession.line_items.data.length}`
        );

        // ✅ 4. Loop through each purchased product
        fullSession.line_items.data.forEach((item, index) => {
          const product = item.price?.product as Stripe.Product;
          const title = product.name;
          const amountPaid = (item.amount_total || 0) / 100; // convert cents to dollars

          console.log(`📦 Item ${index + 1}: ${title}`);
          console.log(`💰 Amount Paid: $${amountPaid}`);
        });
      }

      // ✅ 5. You can now save to AffiliateSale model here
      console.log("✅ Successfully processed checkout session");
    } catch (error: any) {
      console.error("❌ Error retrieving full session:", error.message);
    }
  } else {
    console.log(`ℹ️ Event type not handled: ${event.type}`);
  }

  // ✅ 6. Send response to Stripe
  res.json({ received: true });
}
