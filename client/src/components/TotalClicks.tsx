import { useEffect, useState } from "react";
import BarChart from "./BarChart";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { QUERY_ME } from "../utils/queries";
import { useQuery } from "@apollo/client";
import Button from "./Button";

import "./Analytics.css";

export default function TotalClicks() {
  const { clicksPerDay, clicksPerWeek, clicksPerMonth } = useClicksTracker();
// console.log("clicksPerDay: ", clicksPerDay);
// console.log("clicksPerWeek: ", clicksPerWeek);
// console.log("clicksPerMonth: ", clicksPerMonth);

  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};

  const [clicksRange, setClicksRange] = useState(clicksPerDay);

  const selectClicksRange = (range: string) => {
    if (range === "day") {
      // Showing clicks only for the actual month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const filtered = {
        ...clicksPerDay[0],
        data: clicksPerDay[0]?.data?.filter((entry: any) => {
          const date = new Date(entry.x);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        }),
      };

      setClicksRange([filtered]);
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
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const filtered = {
        ...clicksPerDay[0],
        data: clicksPerDay[0]?.data?.filter((entry: any) => {
          const date = new Date(entry.x);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        }),
      };

      setClicksRange([filtered]);
    }
  }, [clicksPerDay]);

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
