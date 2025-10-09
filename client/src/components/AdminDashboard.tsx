import { Outlet } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_AFFILIATES } from "../utils/queries";
import auth from "../utils/auth";
import { Affiliate } from "../types";
import Navbar from "./Navbar";

import "./Admindashboard.css";

export type AdminOutletContext = {
  data?: { getAffiliates: Affiliate[] };
  loading: boolean;
  errorText?: string;
};

export default function AdminDashboard() {
  const {
    data,
    loading,
    error: errorText,
  } = useQuery(GET_AFFILIATES, {
    skip: !auth.isAdmin(),
  });
  return (
    <>
     <Navbar />
      <br />
      <br />
      <div className="admin-dashboard">
        <Outlet context={{ data, loading, errorText }} /> {/* AffiliateList */}
      </div>
    </>
  );
}
