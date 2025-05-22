import { useEffect, useState } from "react";
import BarChart from "./BarChart";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { QUERY_ME } from "../utils/queries";
import { useQuery } from "@apollo/client";

export default function TotalClicks() {
  const { clicksPerDay, clicksPerWeek, clicksPerMonth } = useClicksTracker();

  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};

  const [clicksRange, setClicksRange] = useState(clicksPerDay);

  const selectClicksRange = (range: string) => {
    if (range === "day") {
      setClicksRange(clicksPerDay);
    }
    if (range === "week") {
      setClicksRange(clicksPerWeek);
    }
    if (range === "month") {
      setClicksRange(clicksPerMonth);
    }
  };

  useEffect(() => {
    if (clicksPerDay) {
      setClicksRange(clicksPerDay);
    }
  }, [clicksPerDay, setClicksRange]);

  return (
    <div className="">
      <h2>Total Clicks:</h2>
      {me.totalClicks && (
        <>
          <strong>Your total clicks - </strong>
          {me.totalClicks}
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
            {clicksRange[0]?.id || "Clicks Overview"}
          </h2>
          <div className="">
            <button className="" onClick={() => selectClicksRange("day")}>
              day
            </button>
            <button className="" onClick={() => selectClicksRange("week")}>
              week
            </button>
            <button className="" onClick={() => selectClicksRange("month")}>
              {" "}
              month
            </button>
          </div>
        </div>
        {clicksRange.length === 0 ? (
          <p>Loading clicks data...</p>
        ) : (
          <BarChart propsData={clicksRange} />
        )}
      </div>
    </div>
  );
}
