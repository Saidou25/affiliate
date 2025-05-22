import TotalSales from "./TotalSales";
import TotalClick from "./TotalClicks";

import "./Analytics.css";
import TotalCommissions from "./TotalCommissions";

export default function Analytics() {
  return (
    <div className="">
      <h2>Analytics</h2>
      <TotalClick />
      <TotalSales />
      <TotalCommissions />
    </div>
  );
}
