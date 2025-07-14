import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

import "./Admin.css";

type Props = {
  data: any;
  loading: boolean;
  errorText?: string;
};

export default function AdminDashboard({ data, loading, errorText }: Props) {
  return (
    <div className="admin-container">
      <Navbar />
      <Outlet context={{ data, loading, errorText }} /> {/* AffiliateList */}
    </div>
  );
}
