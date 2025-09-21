import { useEffect, useState } from "react";
import { useCommissionsTracker } from "../hooks/useCommissionsTracker";
import BarChart from "./BarChart";
import Button from "./Button";

import "./Analytics.css";

export default function TotalCommissions() {
  const { me, commissionPerDay, commissionsPerWeek, commissionsPerMonth } =
    useCommissionsTracker();
  // console.log("commissionPerDay:", commissionPerDay);
  // console.log("commissionsPerWeek:", commissionsPerWeek);
  // console.log("commissionsPerMonth:", commissionsPerMonth);
  const [commissionsRange, setCommissionsRange] = useState(commissionPerDay);

  const selectCommissionsRange = (range: string) => {
    if (range === "day") {
      setCommissionsRange(commissionPerDay);
    }
    if (range === "week") {
      setCommissionsRange(commissionsPerWeek);
    }
    if (range === "month") {
      setCommissionsRange(commissionsPerMonth);
    }
  };

  useEffect(() => {
    if (commissionPerDay) {
      setCommissionsRange(commissionPerDay);
    }
  }, [commissionPerDay, setCommissionsRange]);

  return (
    <>
      <br />
      <h2>Total Commissions:</h2>
      {me?.totalCommissions && (
        <>
          <strong>Your total comissions - </strong>$
          {me?.totalCommissions.toFixed(2)}
          <br />
          <br />
        </>
      )}
      <div className="res">
        <div className="row g-0">
          <div className="col-12 col-md-12 col-lg-6 col-xl-6">
            <h2 className="analytic-title">
              {commissionsRange[0]?.id || "Commissions Overview"}
            </h2>
          </div>
          <div className="col-12 col-md-12 col-lg-6 col-xl-6 analytics-btns">
            <Button
              className="chart-blue-btn"
              onClick={() => selectCommissionsRange("day")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              day
            </Button>
            <Button
              className="chart-blue-btn"
              onClick={() => selectCommissionsRange("week")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              week
            </Button>
            <Button
              className="chart-blue-btn"
              onClick={() => selectCommissionsRange("month")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              {" "}
              month
            </Button>
          </div>
        </div>
        {commissionsRange.length === 0 ? (
          <p>Loading clicks data...</p>
        ) : (
          <BarChart propsData={commissionsRange} />
        )}
      </div>
    </>
  );
}
