import TotalSales from "./TotalSales";
import TotalClick from "./TotalClicks";
import TotalCommissions from "./TotalCommissions";

import "./Analytics.css";

export default function Analytics() {
  return (
    <div className="">
      {/* <h1>Analytics</h1> */}
      <div className="row">
        <div className="col-6">
          <TotalClick />
        </div>
        <div className="col-6">
          <TotalSales />
        </div>
      </div>
      <br />
      <TotalCommissions />
    </div>
  );
}
