import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

import "./Admindashboard.css";

type Props = {
  data: any;
  loading: boolean;
  errorText?: string;
};

export default function AdminDashboard({ data, loading, errorText }: Props) {
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
