import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { Outlet } from "react-router-dom";
// import SalesTaxPolicy from "./SalesTaxPolicy";
import StripeSetupBanner from "./StripeSetupBanner";
import Spinner from "./Spinner";
import Orders from "./Orders";

import "./AffiliateDashboard.css";

export default function AffiliateDashboard() {
  const { data: meData, loading } = useQuery(QUERY_ME);
  const me = meData?.me || {};
  const refId = me?.refId;

  // if (!refId) return <p>Loading affiliate info...</p>;

  return (
    <>
      <br />
      <br />
    <div className="affiliate-dashboard">
      {loading ? <Spinner /> : <StripeSetupBanner affiliateId={me?.id} />}
      {/* Renders nested routes here */}
      <Outlet context={{ refId }} />
    </div>
    <Orders />
    </>
  );
}
