import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { Outlet } from "react-router-dom";
import StripeSetupBanner from "./StripeSetupBanner";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus"; // NEW
import { useMemo } from "react";
import { Affiliate } from "../types";
import Navbar from "./Navbar";
import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";

import "./AffiliateDashboard.css";
// import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";
// import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";

// Export the outlet context type so children can type it
export type AffiliateOutletContext = {
  refId?: string;
  affiliateId?: string;
  me?: Affiliate;
  onboardingStatus?: {
    state: "not_started" | "in_progress" | "complete";
    isStripeMissing: boolean;
    isOnboardingIncomplete: boolean;
    isFullyOnboarded: boolean;
    onboardingNotificationTitle?: string;
    onboardingStatusMessage?: string;
    onboardingStatusButtonMessage?: string;
    onboardingDangerButtonMessage?: string;
    loading: boolean;
  };
};

export default function AffiliateDashboard() {
  const { data: meData } = useQuery(QUERY_ME, {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
    returnPartialData: true,
  });
  const me = meData?.me || {};
  const affiliateId = me?.id;
  const refId = me?.refId;

  // Call the status hook ONCE here
  const status = useCheckOnboardingStatus(affiliateId);

  // Pass only the pieces children need (stable shape via useMemo)
  const onboardingStatus = useMemo(
    () => ({
      state: status.state,
      isStripeMissing: status.isStripeMissing,
      isOnboardingIncomplete: status.isOnboardingIncomplete,
      isFullyOnboarded: status.isFullyOnboarded,
      onboardingNotificationTitle: status.onboardingNotificationTitle,
      onboardingStatusMessage: status.onboardingStatusMessage,
      loading: status.loading,
      onboardingStatusButtonMessage: status.onboardingStatusButtonMessage,
      onboardingDangerButtonMessage: status.onboardingDangerButtonMessage,
    }),
    [
      status.state,
      status.isStripeMissing,
      status.isOnboardingIncomplete,
      status.isFullyOnboarded,
      status.onboardingNotificationTitle,
      status.onboardingStatusMessage,
      status.loading,
      status.onboardingStatusButtonMessage,
      status.onboardingDangerButtonMessage,
    ]
  );

  useOnBoardingNotifications(me, onboardingStatus);

  return (
    <>
      <Navbar me={me} onboardingStatus={onboardingStatus} />
      <br />
      <br />
      <div className="affiliate-dashboard">
        {status.state ? (
          <StripeSetupBanner onboardingStatus={onboardingStatus} />
         ) : null} 
        <br />
        {/* Expose both refId and onboarding to all nested routes */}
        <Outlet context={{ me, affiliateId, refId, onboardingStatus }} />
      </div>
    </>
  );
}
