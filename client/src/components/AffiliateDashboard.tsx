import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { Outlet } from "react-router-dom";
// import SalesTaxPolicy from "./SalesTaxPolicy";
import StripeSetupBanner from "./StripeSetupBanner";
// import Spinner from "./Spinner";
// import Orders from "./Orders";

import "./AffiliateDashboard.css";

export default function AffiliateDashboard() {
  const { data: meData  } = useQuery(QUERY_ME);
  const me = meData?.me || {};
  const affiliateId = me?.id;
  const refId = me?.refId;

  return (
    <>
      <br />
      <br />
      <div className="affiliate-dashboard">
        {affiliateId && <StripeSetupBanner affiliateId={affiliateId} />}
        {/* Renders nested routes here */}
        <Outlet context={{ refId }} />
      </div>
    </>
  );
}
