import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { CHECK_STRIPE_STATUS, QUERY_ME } from "../utils/queries";

export type StripeStatus = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  success: boolean;
  message?: string;
};

type OnboardingState = "not_started" | "in_progress" | "complete";

const useCheckOnboardingStatus = (affiliateId?: string) => {
  // Who am I?
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me ?? {};

  // Decide which id to use for the status query
  const effectiveAffiliateId = affiliateId ?? me?.id;

  const { data, loading, error, refetch } = useQuery<{
    checkStripeStatus: StripeStatus;
  }>(CHECK_STRIPE_STATUS, {
    variables: { affiliateId: effectiveAffiliateId },
    skip: !effectiveAffiliateId, // only if we truly have no id
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    // ↓ don't toggle loading=true for background refetch
    notifyOnNetworkStatusChange: false,
    // ↓ allow partial cached data without going "loading"
    returnPartialData: true,
  });

  const stripeStatus = data?.checkStripeStatus;

  // Derive canonical state
  const state: OnboardingState = useMemo(() => {
    if (!me?.stripeAccountId) return "not_started";
    if (!stripeStatus) return "in_progress"; // we have an account id but no flags yet
    return stripeStatus.payouts_enabled ? "complete" : "in_progress";
  }, [me?.stripeAccountId, stripeStatus]);

  // Optional: human-friendly copy & primary button label
  const { message, buttonLabel, buttonDangerLabel } = useMemo(() => {
    if (state === "not_started") {
      return {
        message:
          "💸 You haven’t connected a payment method yet. To receive your commissions, please link your Stripe account.",
        buttonLabel: "Create connection",
        buttonDangerLabel: undefined,
      };
    }
    if (state === "in_progress") {
      // You can customize based on details_submitted for sharper guidance
      const finishing =
        stripeStatus && !stripeStatus.details_submitted ? "Resume" : "Finish";
      return {
        message:
          "Almost there! Please finish setting up your Stripe account to start receiving payouts.",
        buttonLabel: `${finishing} onboarding`,
        buttonDangerLabel: "Close connection", // ← the cancel/close button label
      };
    }
    return {
      message: "✅ Your Stripe account is connected and ready for payouts.",
      buttonLabel: "Close connection",
    };
  }, [state, stripeStatus]);

  // Handy booleans for rendering
  const isStripeMissing = state === "not_started";
  const isOnboardingIncomplete = state === "in_progress";
  const isFullyOnboarded = state === "complete";

  return {
    // raw
    stripeStatus,
    loading,
    error,
    refetch,

    // derived
    state, // "not_started" | "in_progress" | "complete"
    isStripeMissing,
    isOnboardingIncomplete,
    isFullyOnboarded,

    // UI helpers
    onboardingStatusMessage: message,
    onboardingStatusButtonMessage: buttonLabel,
    onboardingDangerButtonMessage: buttonDangerLabel,
    onboardingNotificationTitle:
      state === "complete"
        ? "Success, Stripe onboarding complete"
        : state === "in_progress"
        ? "Finish your Stripe onboarding"
        : "Stripe account not connected",
  };
};

export default useCheckOnboardingStatus;
