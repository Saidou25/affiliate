import AffiliatesList from "./AffiliatesList";
import AffiliatesSalesReport from "./AffiliatesSalesReport";

import "./Admin.css";


export default function Admin() {

  return (
    <div className="admin-container">
      <h1 className="">Admin Dashboard</h1>
      <AffiliatesList />
      <AffiliatesSalesReport />
      
    </div>
  );
}
