import AffiliatesList from "./AffiliatesList";
import AffiliatesSalesReport from "./AffiliatesSalesReport";
import { useQuery } from "@apollo/client";
import { GET_AFFILIATES } from "../utils/queries";

import "./Admin.css";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  __typename?: string;
}

export default function Admin() {
  const { data, loading, error } = useQuery<{ getAffiliates: Affiliate[] }>(
    GET_AFFILIATES
  );

  return (
    <div className="admin-container">
      <h1 className="">Admin Dashboard</h1>
      <AffiliatesList
        data={data}
        loading={loading}
        errorText={error?.message}
      />
      <AffiliatesSalesReport  />
    </div>
  );
}
