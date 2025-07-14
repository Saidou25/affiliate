import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { Outlet } from "react-router-dom";
// import SalesTaxPolicy from "./SalesTaxPolicy";
import Navbar from "./Navbar";
import StripeSetupBanner from "./StripeSetupBanner";
import useCheckOnboardingStatus from "../hooks/useCheckOnboardingStatus";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";

import "./AffiliateDashboard.css";

export default function AffiliateDashboard() {
  const [message, setMessage] = useState("");
  const [buttonMessage, setButtonMessage] = useState("");

  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};
  const refId = me?.refId;

  const { stripeStatusData, loading } = useCheckOnboardingStatus(me.id);

  useEffect(() => {
    if (!me?.stripeAccountId) {
      setMessage(
        "💸 You haven't set up your payment method yet. To receive commissions, please complete your Stripe setup."
      );
      setButtonMessage("Set Up Payments");
    } else if (
      stripeStatusData &&
      stripeStatusData.id &&
      !stripeStatusData.payouts_enabled
    ) {
      setMessage("Please finish completing your Stripe setup");
      setButtonMessage("Finish Set Up");
    } else if (stripeStatusData?.payouts_enabled) {
      setMessage("account connected");
    }
  }, [me?.stripeAccountId, stripeStatusData]);

  if (!refId) return <p>Loading affiliate info...</p>;

  return (
    <div className="">
      <Navbar />
      <br />
      <br />
      {loading ? (
        <Spinner />
      ) : (
        <div>
          <StripeSetupBanner affiliateId={me?.id} />
        </div>
      )}
      {/* Renders nested routes here */}
      <Outlet context={{ refId }} />
    </div>
  );
}
