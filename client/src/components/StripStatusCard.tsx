import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CREATE_AFFILIATE_STRIPE_ACCOUNT,
  DELETE_NOTIFICATION,
  DISCONNECT_STRIPE_ACCOUNT,
} from "../utils/mutations";
import { QUERY_ME } from "../utils/queries";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";
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

  const {
    state, // "not_started" | "in_progress" | "complete"
    onboardingStatusMessage,
    onboardingStatusButtonMessage,
    onboardingDangerButtonMessage,
    loading,
  } = useCheckOnboardingStatus(affiliateId);

  const [createStripeAccount, { loading: createLoading }] = useMutation(
    CREATE_AFFILIATE_STRIPE_ACCOUNT
  );
  const [disconnectStripeAccount, { loading: disconnectLoading }] = useMutation(
    DISCONNECT_STRIPE_ACCOUNT
  );
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);

  // Only needed for clearing notifications after disconnect
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me ?? {};

  const startOrResume = async () => {
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
        setTimeout(() => (window.location.href = url), 3000);
      }
    } catch (err: any) {
      console.error("⚠️ Failed to create/resume onboarding:", err.message);
    }
  };

  const closeConnection = async () => {
    const idToUse = affiliateId ?? me?.id;
    if (!idToUse) return;

    try {
      const { data } = await disconnectStripeAccount({
        variables: { affiliateId: idToUse },
      });

      if (data?.disconnectStripeAccount?.success) {
        setStripeMessage("Stripe account successfully disconnected.");
        setShowStripeMessage(true);

        if (me?.refId) {
          await deleteNotification({ variables: { refId: me.refId } });
          console.log("🧹 Onboarding notifications removed.");
        }
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

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {state === "not_started" && (
          <Button className="blue-btn-settings" onClick={startOrResume}>
            {createLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatusButtonMessage}</span>
            )}
          </Button>
        )}

        {state === "in_progress" && (
          <>
            <Button className="blue-btn-settings" onClick={startOrResume}>
              {createLoading ? (
                <Spinner />
              ) : (
                <span>{onboardingStatusButtonMessage}</span>
              )}
            </Button>
            <Button
              className="blue-btn-settings danger-btn"
              onClick={() => setShowModal(true)}
            >
              {disconnectLoading ? (
                <Spinner />
              ) : (
                <span>{onboardingDangerButtonMessage}</span>
              )}
            </Button>
          </>
        )}

        {state === "complete" && (
          <Button
            className="blue-btn-settings danger-btn"
            onClick={() => setShowModal(true)}
          >
            {disconnectLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatusButtonMessage}</span>
            )}
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
          loading={disconnectLoading}
          setStripeMessage={setStripeMessage}
        />
      )}
    </div>
  );
}
