import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";

import "./StripeSetupBanner.css";
import { IoMdClose } from "react-icons/io";
import Button from "./Button";

type Props = {
  affiliateId: string;
};

export default function StripeSetupBanner({ affiliateId }: Props) {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  const { onboardingStatusMessage, onboardingStatusButtonMessage } =
    useCheckOnboardingStatus(affiliateId);

 if (
  !onboardingStatusMessage || // don't render while it's falsy
  onboardingStatusMessage === "✅ Your Stripe account is connected and ready for payouts." ||
  !visible
) {
  return null;
}


  return (
    <div className="stripe-banner-div">
      <div className="title-close-div">
        <h2>Stripe Payment Setup</h2>
        <IoMdClose
          className="stripe-close"
          onClick={() => setVisible(false)}
          aria-label="Close"
        />
          {/* ×
        </button> */}
      </div>
      <div className="stripe-banner">
        <p className="stripe-text">{onboardingStatusMessage}</p>
        <div className="stripe-actions">
          <Button
            className="blue-btn"
            onClick={() => navigate("settings")}
          >
            {onboardingStatusButtonMessage}
          </Button>
        </div>
      </div>
    </div>
  );
}
