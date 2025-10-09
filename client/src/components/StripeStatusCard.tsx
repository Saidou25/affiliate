import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CREATE_AFFILIATE_STRIPE_ACCOUNT,
  DISCONNECT_STRIPE_ACCOUNT,
} from "../utils/mutations";
import Spinner from "./Spinner";
import Button from "./Button";
import ConfirmCloseConnectionModal from "./ConfirmCloseConnectionModal";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { useResetOnboardingCycle } from "../hooks/resetOnboardingCycle";

interface Props {
  refId?: string;
  affiliateId?: string;
  onboardingStatus?: AffiliateOutletContext["onboardingStatus"];
}

export default function StripeStatusCard({
  refId,
  affiliateId,
  onboardingStatus,
}: Props) {
  const [showStripeMessage, setShowStripeMessage] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [createStripeAccount, { loading: createLoading }] = useMutation(
    CREATE_AFFILIATE_STRIPE_ACCOUNT
  );
  const [disconnectStripeAccount, { loading: disconnectLoading }] = useMutation(
    DISCONNECT_STRIPE_ACCOUNT
  );

  const deleteOnboarding = useResetOnboardingCycle();

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
    if (!affiliateId) return;

    try {
      const { data } = await disconnectStripeAccount({
        variables: { affiliateId: affiliateId },
      });

      if (data?.disconnectStripeAccount?.success) {
        if (!refId) return;
        const ok = await deleteOnboarding(refId);
        if (ok) {
          setStripeMessage("Stripe account successfully disconnected.");
          setShowStripeMessage(true);
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

  if (onboardingStatus?.loading) return <p>Loading Stripe status...</p>;

  return (
    <div style={{ borderRadius: "8px", color: "white" }}>
      <h3>Stripe Payment Setup</h3>
      <p>{onboardingStatus?.onboardingStatusMessage}</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {onboardingStatus?.state === "not_started" && (
          <Button className="blue-btn-settings" onClick={startOrResume}>
            {createLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatus.onboardingStatusButtonMessage}</span>
            )}
          </Button>
        )}

        {onboardingStatus?.state === "in_progress" && (
          <>
            <Button className="blue-btn-settings" onClick={startOrResume}>
              {createLoading ? (
                <Spinner />
              ) : (
                <span>{onboardingStatus.onboardingStatusButtonMessage}</span>
              )}
            </Button>
            <Button
              className="blue-btn-settings danger-btn"
              onClick={() => setShowModal(true)}
            >
              {disconnectLoading ? (
                <Spinner />
              ) : (
                <span>{onboardingStatus.onboardingDangerButtonMessage}</span>
              )}
            </Button>
          </>
        )}

        {onboardingStatus?.state === "complete" && (
          <Button
            className="blue-btn-settings danger-btn"
            onClick={() => setShowModal(true)}
          >
            {disconnectLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatus?.onboardingStatusButtonMessage}</span>
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
