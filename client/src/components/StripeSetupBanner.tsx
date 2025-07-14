import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StripeSetupBanner.css";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";

type Props = {
  affiliateId: string
};

export default function StripeSetupBanner({ affiliateId }: Props) {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  const { onboardingStatusMessage, onboardingStatusButtonMessage, loading } =
    useCheckOnboardingStatus(affiliateId);

  if (onboardingStatusMessage === "✅ Your Stripe account is connected and ready for payouts." || !visible) return null;

  return (
    <div className="stripe-banner-div">
      <h2>Stripe Payment Setup</h2>
      <div className="stripe-banner">
        <p className="stripe-text">{onboardingStatusMessage}</p>
        <div className="stripe-actions">
          <button
            className="stripe-button"
            onClick={() => navigate("settings")}
          >
            {onboardingStatusButtonMessage}
          </button>
          <button
            className="stripe-close"
            onClick={() => setVisible(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
