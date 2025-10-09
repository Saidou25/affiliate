import { useEffect, useState } from "react";
import { useSalesTracker } from "../hooks/useSalesTracker";
import BarChart from "./BarChart";
import Button from "./Button";
import { useOutletContext } from "react-router-dom";
import { AffiliateOutletContext } from "./AffiliateDashboard";

import "./Analytics.css";

export default function TotalSales() {
   const { refId } =
    useOutletContext<AffiliateOutletContext>();

  const { totalSales, salesPerDay, salesPerWeek, salesPerMonth } =
    useSalesTracker(refId || "");

    // console.log(totalSales)
  const [salesRange, setSalesRange] = useState(salesPerDay);

  const selectSalesRange = (range: string) => {
    if (range === "day") {
      setSalesRange(salesPerDay);
    }
    if (range === "week") {
      // console.log(salesPerWeek[0].data);
      setSalesRange(salesPerWeek);
    }
    if (range === "month") {
      setSalesRange(salesPerMonth);
    }
  };

  useEffect(() => {
    if (salesPerDay) {
      setSalesRange(salesPerDay);
    }
  }, [salesPerDay, setSalesRange]);

  return (
    <>
      <br />
      <h2>Total Sales(Orders):</h2>
      <strong className="">
        Your total sales(orders) -{" "}
        {totalSales ? totalSales : <p>Loading sales data...</p>}
      </strong>
      <br />
      <br />
      <div className="res">
        <div className="row g-0">
          <div className="col-12 col-md-12 col-lg-12 col-xl-6">
            <h3 className="analytic-title">
              {salesRange[0]?.id || "Sales Overview"}
            </h3>
          </div>
          <div className="col-12 col-md-12 col-lg-12 col-xl-6 analytics-btns">
            <Button
              className="chart-blue-btn"
              onClick={() => selectSalesRange("day")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              day
            </Button>
            <Button
              className="chart-blue-btn"
              onClick={() => selectSalesRange("week")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              week
            </Button>
            <Button
              className="chart-blue-btn"
              onClick={() => selectSalesRange("month")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              {" "}
              month
            </Button>
          </div>
        </div>
        {salesRange.length === 0 ? (
          <p>Loading sales data...</p>
        ) : (
          <BarChart propsData={salesRange} />
        )}
      </div>
    </>
  );
}
