import {  useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { CHECK_STRIPE_STATUS, QUERY_ME } from "../utils/queries";

type StripeStatus = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  success: boolean;
  message?: string;
};

const useCheckOnboardingStatus = (affiliateId?: string) => {
  const [stripeStatusData, setStripeStatusData] = useState<StripeStatus | null>(
    null
  );
  const [onboardingStatusMessage, setOnboardingStatusMessage] = useState("");
  const [onboardingStatusButtonMessage, setOnboardingStatusButtonMessage] =
    useState("");
  const [onboardingNotificationTitle, setOnboardingNotificationTitle] =
    useState("");

  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const { data, loading, error } = useQuery(CHECK_STRIPE_STATUS, {
    variables: { affiliateId },
    skip: !affiliateId, // only runs when affiliateId exists
  });

  useEffect(() => {
    if (data?.checkStripeStatus) {
      setStripeStatusData(data.checkStripeStatus);
    }
  }, [data]);

  // Defines onboarding messages after stripeStatusData is updated
  useEffect(() => {
    if (!me?.stripeAccountId) {
      setOnboardingStatusMessage(
        "💸 You haven’t connected a payment method yet. To receive your commissions, please link your Stripe account."
      );
      setOnboardingStatusButtonMessage("Connect Stripe");
      setOnboardingNotificationTitle("Stripe account not connected");
    } else if (stripeStatusData && !stripeStatusData.payouts_enabled) {
      setOnboardingStatusMessage(
        "Almost there! Please finish setting up your Stripe account to start receiving payouts."
      );
      setOnboardingStatusButtonMessage("Finish Onboarding");
      setOnboardingNotificationTitle("Finish your Stripe onboarding");
    } else if (stripeStatusData?.payouts_enabled) {
      setOnboardingStatusMessage(
        "✅ Your Stripe account is connected and ready for payouts."
      );
      setOnboardingStatusButtonMessage("Stripe Connected");
      setOnboardingNotificationTitle("Success, Stripe onBoarding complete");
    }
  }, [me?.stripeAccountId, stripeStatusData]);

  const isStripeMissing = !me?.stripeAccountId;
  const isOnboardingIncomplete =
    stripeStatusData && !stripeStatusData.payouts_enabled;
  const isFullyOnboarded = stripeStatusData?.payouts_enabled;

  return {
    stripeStatusData,
    isStripeMissing,
    isOnboardingIncomplete,
    isFullyOnboarded,
    onboardingNotificationTitle,
    onboardingStatusMessage,
    onboardingStatusButtonMessage,
    loading,
    error,
  };
};

export default useCheckOnboardingStatus;
