import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useNavigate } from "react-router-dom";
import StripeStatusCard from "./StripStatusCard";
import Profile from "./Profile";
import Button from "./Button";

import "./Settings.css";

export default function Settings() {
  const { data, loading } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const navigate = useNavigate();

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>

      <div className="settings-section">
        <StripeStatusCard affiliateId={me.id} />
      </div>

      <div className="settings-section">
        <h3>Profile</h3>
        <Profile />
        <Button onClick={() => navigate("/affiliate/profile")} className="blue-btn-profile">
          Edit Profile
        </Button>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <p>
          You’ll be notified here about your affiliate sales, commission
          payments, and system updates.
        </p>
        <Button
          onClick={() => navigate("/affiliate/notifications")}
          className="blue-btn"
        >
          View Notifications
        </Button>
      </div>
    </div>
  );
}
