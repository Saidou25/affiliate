import { useMutation, useQuery } from "@apollo/client";
import { CREATE_AFFILIATE_STRIPE_ACCOUNT } from "../utils/mutations";
import { QUERY_ME } from "../utils/queries";
import { useState } from "react";

export default function OnboardStripeButton() {
  const { data } = useQuery(QUERY_ME);
  const me = data?.me;
  const affiliateId = me?.id;

  const [showStripeMessage, setShowStripeMessage] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");

  const [createStripeAccount, { loading }] = useMutation(
    CREATE_AFFILIATE_STRIPE_ACCOUNT,
    {
      onCompleted: (result) => {
        const { url, resumed } = result?.createAffiliateStripeAccount || {};
        if (url) {
          setStripeMessage(
            resumed
              ? "Resuming your Stripe onboarding process..."
              : "You're about to start your Stripe onboarding process..."
          );
          setShowStripeMessage(true);

          setTimeout(() => {
            window.location.href = url;
          }, 3000);
        }
      },
      onError: (err) => {
        alert("❌ Error starting onboarding: " + err.message);
        console.error(err);
      },
    }
  );

  const handleClick = () => {
    if (!affiliateId) {
      alert("User not logged in.");
      return;
    }
    createStripeAccount({ variables: { affiliateId } });
  };

  return (
    <>
      <button onClick={handleClick} disabled={loading || showStripeMessage}>
        {loading || showStripeMessage
          ? "Redirecting to Stripe..."
          : "Connect Stripe Account"}
      </button>

      {showStripeMessage && (
        <p style={{ marginTop: "1rem", color: "green" }}>{stripeMessage}</p>
      )}
    </>
  );
}
