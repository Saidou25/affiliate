import { Outlet } from "react-router-dom";
import { Affiliate } from "../types";

import "./Admindashboard.css";

type Props = {
  data?: { getAffiliates: Affiliate[] };
  loading: boolean;
  errorText?: string;
};

export default function AdminDashboard({ data, loading, errorText }: Props) {
  return (
    <>
      <br />
      <br />
      <div className="admin-dashboard">
        <Outlet context={{ data, loading, errorText }} /> {/* AffiliateList */}
      </div>
    </>
  );
}
