import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import {
  CREATE_AFFILIATE_STRIPE_ACCOUNT,
  DISCONNECT_STRIPE_ACCOUNT,
} from "../utils/mutations";
import ConfirmCloseConnectionModal from "./ConfirmCloseConnectionModal";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { useResetOnboardingCycle } from "../hooks/useResetOnboardingCycle";
import Spinner from "./Spinner";
import Button from "./Button";
import OpenStripeDashboardButtonGQL from "./OpenStripeDashboardButtonGQL";

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
    DISCONNECT_STRIPE_ACCOUNT,
    {
      // runs only after the mutation succeeds on the server
      update(cache, { data }) {
        const ok = data?.disconnectStripeAccount?.success;
        if (!ok || !refId) return;

        const cacheId = cache.identify({ __typename: "Affiliate", refId });

        cache.modify({
          id: cacheId,
          fields: {
            // only flip the Stripe connection locally
            stripeAccountId() {
              return null;
            },
            // notifications are handled by  deleteOnboarding hook's own update()
            // so we don't touch them here.
          },
        });
      },
    }
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
      const res = await disconnectStripeAccount({ variables: { affiliateId } });

      // while debugging
      // console.log("[disconnectStripeAccount] data:", res.data);
      // console.log("[disconnectStripeAccount] errors:", res.errors);

      const payload = res.data?.disconnectStripeAccount;
      const success = payload?.success === true;

      if (success) {
        if (!refId) return;

        // Reset onboarding notifications (hook updates cache for notifications)
        const ok = await deleteOnboarding(refId);
        if (ok) {
          setStripeMessage("Stripe account successfully disconnected.");
          setShowStripeMessage(true);
          setShowModal(false);
        }
        return;
      }

      // Not success → surface why
      const reason =
        payload?.reason || res.errors?.[0]?.message || "unknown-error";
      console.warn("⚠️ Stripe disconnection did not complete. reason:", reason);

      if (reason === "standard-account") {
        setStripeMessage(
          "This is a Standard Stripe account. Please disconnect it from your Stripe Dashboard (OAuth deauthorize)."
        );
        setShowStripeMessage(true);
        return;
      }

      if (reason === "retrieve-failed") {
        setStripeMessage(
          "We couldn’t retrieve the Stripe account. Check test vs live mode and that the account ID exists."
        );
        setShowStripeMessage(true);
        return;
      }

      setStripeMessage(
        "Stripe disconnection did not complete. Please try again."
      );
      setShowStripeMessage(true);
    } catch (error) {
      console.error("❌ Error disconnecting Stripe account:", error);
      setStripeMessage("Unexpected error. Please try again.");
      setShowStripeMessage(true);
    }
  };

  useEffect(() => {
    if (stripeMessage === "Stripe account successfully disconnected.") {
      const timer = setTimeout(() => {
        setStripeMessage("");
        setShowModal(false);
      }, 4500);
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
          <Button
            className="blue-btn-settings"
            onClick={startOrResume}
            disabled={disconnectLoading}
          >
            {createLoading ? (
              <Spinner />
            ) : (
              <span>{onboardingStatus.onboardingStatusButtonMessage}</span>
            )}
          </Button>
        )}

        {onboardingStatus?.state === "in_progress" && (
          <>
            <Button
              className="blue-btn-settings"
              onClick={startOrResume}
              disabled={disconnectLoading}
            >
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
          <>
            <OpenStripeDashboardButtonGQL
              refId={refId}
              className="blue-btn-settings"
              label="Open Stripe Dashboard"
            />
            <Button
              className="blue-btn-settings danger-btn"
              onClick={() => setShowModal(true)}
              disabled={disconnectLoading}
            >
              {disconnectLoading ? (
                <Spinner />
              ) : (
                <span>{onboardingStatus?.onboardingStatusButtonMessage}</span>
              )}
            </Button>
          </>
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
