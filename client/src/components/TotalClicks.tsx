import { useEffect, useState } from "react";
import BarChart from "./BarChart";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { QUERY_ME } from "../utils/queries";
import { useQuery } from "@apollo/client";
import Button from "./Button";

import "./Analytics.css";

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
      <br />
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
            <Button
              className="blue-btn"
              onClick={() => selectClicksRange("day")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
              type="button"
            >
              day
            </Button>
            <Button
              className="blue-btn"
              onClick={() => selectClicksRange("week")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
              type="button"
            >
              week
            </Button>
            <Button
              className="blue-btn"
              onClick={() => selectClicksRange("month")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
              type="button"
            >
              {" "}
              month
            </Button>
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
