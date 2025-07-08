import { Link } from "react-router-dom";

export default function StripeReturn() {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎉 Stripe onboarding complete!</h2>
      <p>Your Stripe account is now connected and ready to receive payouts.</p>
      <Link to="/affiliate/products">Go to Dashboard</Link>
    </div>
  );
}
