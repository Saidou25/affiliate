import TotalSales from "./TotalSales";
import TotalClick from "./TotalClicks";

import "./Analytics.css";

export default function Analytics() {
  return (
    <div className="">
      <h2>Analytics</h2>
      <TotalSales />
      <TotalClick />
    </div>
  );
}
