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
    <>
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
        <div className="row g-0">
          <div className="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6">
            <h3 className="analytics-title">
              {clicksRange[0]?.id || "Clicks Overview"}
            </h3>
          </div>
          <div className="col-xs-12 col-sm-6 col-md-6 col-lg-6 col-xl-6 analytics-btns">
            <Button
              className="chart-blue-btn"
              onClick={() => selectClicksRange("day")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
              type="button"
            >
              day
            </Button>
            <Button
              className="chart-blue-btn"
              onClick={() => selectClicksRange("week")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
              type="button"
            >
              week
            </Button>
            <Button
              className="chart-blue-btn"
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
    </>
  );
}
