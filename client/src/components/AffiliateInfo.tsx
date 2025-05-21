import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import Products from "./Products";
import TotalClick from "./TotalClick";
import Profile from "./Profile";
import SalesData from "./SalesData";
import Commissions from "./Commissions";

import "./AffiliateInfo.css";
import Analytics from "./Analytics";

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
      <Commissions />
      <SalesData />
      <h2>Analytics</h2>
      <Analytics />
      <TotalClick />
      <Products />
    </div>
  );
}
