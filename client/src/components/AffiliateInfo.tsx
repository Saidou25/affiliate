import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import Products from "./Products";
import Profile from "./Profile";
import Analytics from "./Analytics";

import "./AffiliateInfo.css";
import DetailedReport from "./DetailedReport";
import SalesTaxPolicy from "./SalesTaxPolicy";

export default function AffiliateInfo() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  // console.log(me);

  if (!refId) return <p>Loading affiliate info...</p>;

  return (
    <div className="my-profile">
      <h1>Affiliate's Dashboard</h1>
      <Profile />
      <DetailedReport />
      <Analytics />
      <Products />
      <SalesTaxPolicy />
    </div>
  );
}
