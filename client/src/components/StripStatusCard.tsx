import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CREATE_AFFILIATE_STRIPE_ACCOUNT,
  DELETE_NOTIFICATION,
  DISCONNECT_STRIPE_ACCOUNT,
} from "../utils/mutations";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";
import { QUERY_ME } from "../utils/queries";
import Spinner from "./Spinner";
import Button from "./Button";
import ConfirmCloseConnectionModal from "./ConfirmCloseConnectionModal";

interface Props {
  affiliateId?: string;
}

export default function StripeStatusCard({ affiliateId }: Props) {
  const [showStripeMessage, setShowStripeMessage] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { onboardingStatusMessage, onboardingStatusButtonMessage, loading } =
    useCheckOnboardingStatus(affiliateId);

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);

  const [disconnectStripeAccount, { loading: loadingDisconnect }] = useMutation(
    DISCONNECT_STRIPE_ACCOUNT
  );
  const [createStripeAccount, { loading: creatStripeAccountLoading }] =
    useMutation(CREATE_AFFILIATE_STRIPE_ACCOUNT);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const handleResumeOnboarding = async () => {
    try {
      const { data } = await createStripeAccount({
        variables: { affiliateId },
      });

      const { url, resumed } = data?.createAffiliateStripeAccount || {};
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
    } catch (err: any) {
      console.error("⚠️ Failed to resume onboarding:", err.message);
    }
  };

  const closeConnection = async () => {
    if (!me.stripeAccountId) return;

    try {
      const { data } = await disconnectStripeAccount({
        variables: { affiliateId: me.id },
      });

      if (data?.disconnectStripeAccount?.success) {
        setStripeMessage("Stripe account successfully disconnected.");
        setShowStripeMessage(true);

        await deleteNotification({ variables: { refId: me.refId } });
        console.log("🧹 Onboarding notifications removed.");
      } else {
        console.warn("⚠️ Stripe disconnection did not complete.");
      }
    } catch (error) {
      console.error("❌ Error disconnecting Stripe account:", error);
    }
  };

  useEffect(() => {
    if (stripeMessage === "Stripe account successfully disconnected.") {
      const timer = setTimeout(() => {
        setStripeMessage("");
        setShowModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stripeMessage]);

  if (loading) return <p>Loading Stripe status...</p>;

  return (
    <div style={{ borderRadius: "8px", color: "white" }}>
      <h3>Stripe Payment Setup</h3>
      <p>{onboardingStatusMessage}</p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {!onboardingStatusMessage.includes("ready for payout") && (
          <Button
            className="blue-btn-settings"
            onClick={handleResumeOnboarding}
          >
            {creatStripeAccountLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatusButtonMessage}</span>
            )}
          </Button>
        )}

        {me.stripeAccountId && (
          <Button
            className="blue-btn-settings"
            onClick={() => setShowModal(true)}
          >
            {loadingDisconnect ? <Spinner /> : <span>Close Connection</span>}
          </Button>
        )}
      </div>
      {showStripeMessage && (
        <p style={{ marginTop: "1rem", color: "green" }}>{stripeMessage}</p>
      )}
      {showModal && (
        <ConfirmCloseConnectionModal
          setShowModal={setShowModal}
          closeConnection={closeConnection}
          closeConnectionMessage={stripeMessage}
          loading={loadingDisconnect}
          setStripeMessage={setStripeMessage}
        />
      )}
    </div>
  );
}
