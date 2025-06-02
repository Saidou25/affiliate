import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
// import SalesTaxPolicy from "./SalesTaxPolicy";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

import "./AffiliateDashboard.css";

export default function AffiliateDashboard() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  if (!refId) return <p>Loading affiliate info...</p>;

  return (
    <div className="my-profile">
      <Navbar />
      {/* Renders nested routes here */}
      <Outlet context={{ refId }} />
      {/* <SalesTaxPolicy /> */}
    </div>
  );
}
