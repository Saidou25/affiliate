import { Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import AffiliateDashboard from "./components/AffiliateDashboard";
import Profile from "./components/Profile";
import Analytics from "./components/Analytics";
import DetailedReport from "./components/DetailedReport";
import { Affiliate } from "./types";
import { useQuery } from "@apollo/client";
import { GET_AFFILIATES, QUERY_ME } from "./utils/queries";
import Products from "./components/Products";
// import DataCenter from "./components/DataCenter";
import AffiliatesSalesReport from "./components/AffiliatesSalesReport";
import AffiliatesLookUp from "./components/AffiliatesLookUp";
import AffiliatesList from "./components/AffiliatesList";
import AdminDashboard from "./components/AdminDashboard";
import StripeReturn from "./components/StripeReturn";
import NotificationsList from "./components/NotificationsList";
import Settings from "./components/Settings";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import WooSyncCard from "./components/WooSyncCard";
import StripeChargesTable from "./components/StripeChargesListTable";
import ProfileEdit from "./components/ProfileEdit";

import "bootswatch/dist/lux/bootstrap.min.css";

import "./App.css";

function App() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  const { data, loading, error } = useQuery<{ getAffiliates: Affiliate[] }>(
    GET_AFFILIATES
  );

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stripe-onboarding/return" element={<StripeReturn />} />
        <Route
          path="/admin"
          element={
            <AdminDashboard
              data={data}
              loading={loading}
              errorText={error?.message}
            />
          }
        >
          <Route
            path="affiliates"
            element={
              <AffiliatesList
                data={data}
                loading={loading}
                errorText={error?.message}
              />
            }
          />
          <Route path="look up" element={<AffiliatesLookUp />} />
          <Route path="sales report" element={<AffiliatesSalesReport />} />
          {/* <Route path="data center" element={<DataCenter />} /> */}
          <Route path="/admin/wooproducts" element={<WooSyncCard />} />
          <Route path="stripe list" element={<StripeChargesTable />} />
        </Route>

        <Route path="/affiliate" element={<AffiliateDashboard />}>
          <Route path="notifications" element={<NotificationsList />} />
          <Route path="products" element={<Products />} />
          <Route path="reports" element={<DetailedReport refId={refId} />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile-edit" element={<ProfileEdit />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
