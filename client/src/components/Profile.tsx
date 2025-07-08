import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import OnboardStripeButton from "./OnboardStripeButton";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";
import { useEffect } from "react";
import StripeStatusCard from "./StripStatusCard";

export default function Profile() {
  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { stripeStatusData, loading } = useCheckOnboardingStatus(me.id);
  // console.log(stripeStatusData, loading, error);

  useEffect(() => {
    if (stripeStatusData) {
      // console.log("✅ Stripe status:", stripeStatusData);
      if (
        !stripeStatusData.charges_enabled ||
        !stripeStatusData.payouts_enabled
      ) {
        console.log("Affiliate is not fully onboarded.");
      }
    }
  }, [stripeStatusData]);

  return (
    <>
      <h2>My Profile</h2>
      <div
        className="profile-container"
        style={{
          backgroundColor: "black",
          padding: "2%",
          borderRadius: "10px",
        }}
      >
        {me.name && (
          <>
            <strong>Name - </strong>
            {me.name}
            <br />
          </>
        )}
        {me.email && (
          <>
            <strong>Email - </strong>
            {me.email}
            <br />
          </>
        )}
        {me.refId && (
          <>
            <strong>My reference id - </strong>
            {me.refId} <br />
          </>
        )}
        {me.commissionRate && (
          <>
            <strong>Commission rate - </strong>
            {me.commissionRate * 100}%<br />
          </>
        )}
        <br />
        {!me.stripeAccountId && !stripeStatusData?.payouts_enabled && (
          <OnboardStripeButton />
        )}
        <StripeStatusCard
          affiliateId={me.id}
          stripeStatusData={stripeStatusData}
          loading={loading}
        />
      </div>
    </>
  );
}
