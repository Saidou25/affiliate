import { useEffect, useState } from "react";
import { useSalesTracker } from "../hooks/useSalesTracker";
import BarChart from "./BarChart";

export default function TotalSales() {
  const { totalSales, salesPerDay, salesPerWeek, salesPerMonth } =
    useSalesTracker();

  const [salesRange, setSalesRange] = useState(salesPerDay);

  const selectSalesRange = (range: string) => {
    if (range === "day") {
      setSalesRange(salesPerDay);
    }
    if (range === "week") {
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
    <div className="">
      <h2>Total Sales(Orders):</h2>
      <strong className="">
        Your total sales(orders) -{" "}
        {totalSales ? totalSales : <p>Loading sales data...</p>}
      </strong>
      <br />
      <br />
      <div className="res">
        <div
          className="select-range"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h2 className="analytic-title">
            {salesRange[0]?.id || "Sales Overview"}
          </h2>
          <div className="">
            <button className="range-button" onClick={() => selectSalesRange("day")}>
              day
            </button>
            <button className="range-button" onClick={() => selectSalesRange("week")}>
              week
            </button>
            <button className="range-button" onClick={() => selectSalesRange("month")}>
              {" "}
              month
            </button>
          </div>
        </div>
        {salesRange.length === 0 ? (
          <p>Loading sales data...</p>
        ) : (
          <BarChart propsData={salesRange} />
        )}
      </div>
    </div>
  );
}
