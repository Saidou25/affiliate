import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useNavigate } from "react-router-dom";
import OnboardStripeButton from "./OnboardStripeButton";
import "./Settings.css";

export default function Settings() {
  const { data, loading } = useQuery(QUERY_ME);
  const navigate = useNavigate();

  if (loading) return <p>Loading settings...</p>;

  const me = data?.me || {};

  return (
    <div className="settings-container">
      <h2 style={{ color: "black" }}>Account Settings</h2>

      <div className="settings-section">
        <h3>Stripe Payment Setup</h3>
        <p>
          {me.stripeAccountId
            ? "Your Stripe account is connected."
            : "You haven't connected a Stripe account yet. Please complete onboarding to receive commissions."}
        </p>
        <OnboardStripeButton />
      </div>

      <div className="settings-section">
        <h3>Profile</h3>
        <p><strong>Name:</strong> {me.name}</p>
        <p><strong>Email:</strong> {me.email}</p>
        <button onClick={() => navigate("profile")} className="settings-btn">
          Edit Profile
        </button>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <p>
          You’ll be notified here about your affiliate sales, commission payments, and system updates.
        </p>
        <button onClick={() => navigate("notifications")} className="settings-btn">
          View Notifications
        </button>
      </div>
    </div>
  );
}
