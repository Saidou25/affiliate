import { useEffect, useState } from "react";
import { useCommissionsTracker } from "../hooks/useCommissionsTracker";
import BarChart from "./BarChart";

import "./Analytics.css";

export default function TotalCommissions() {
   
  const { me, commissionPerDay, commissionsPerWeek, commissionsPerMonth } = useCommissionsTracker();

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
    <div className="">
      <h2>Total Commissions:</h2>
      {me?.totalCommissions && (
        <>
          <strong>Your total comissions - </strong>
          ${me?.totalCommissions.toFixed(2)}
          <br />
          <br />
        </>
      )}
      <div className="res">
        <div
          className="select-range"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h2 className="analytic-title">
            {commissionsRange[0]?.id || "Commissions Overview"}
          </h2>
          <div className="">
            <button className="range-button" onClick={() => selectCommissionsRange("day")}>
              day
            </button>
            <button className="range-button" onClick={() => selectCommissionsRange("week")}>
              week
            </button>
            <button className="range-button" onClick={() => selectCommissionsRange("month")}>
              {" "}
              month
            </button>
          </div>
        </div>
        {commissionsRange.length === 0 ? (
          <p>Loading clicks data...</p>
        ) : (
          <BarChart propsData={commissionsRange} />
        )}
      </div>
    </div>
  );
}
