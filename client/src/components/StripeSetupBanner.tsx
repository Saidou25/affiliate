import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StripeSetupBanner.css";

type Props = {
  stripeAccountId?: string;
  message?: string;
  buttonMessage?: string;
};

export default function StripeSetupBanner({ message, buttonMessage }: Props) {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  if (message === "account connected" || !visible) return null;

  return (
    <div className="stripe-banner">
      <p className="stripe-text">{message}</p>
      <div className="stripe-actions">
        <button
          className="stripe-button"
          onClick={() => navigate("settings")}
        >
          {buttonMessage}
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
  );
}
