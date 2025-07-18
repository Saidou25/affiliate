import TotalSales from "./TotalSales";
import TotalClick from "./TotalClicks";
import TotalCommissions from "./TotalCommissions";

import "./Analytics.css";

export default function Analytics() {
  return (
    <div className="">
      <h1>Analytics</h1>
      <TotalClick />
      <TotalSales />
      <TotalCommissions />
    </div>
  );
}
