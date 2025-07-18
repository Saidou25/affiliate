import { useEffect, useState } from "react";
import { useSalesTracker } from "../hooks/useSalesTracker";
import BarChart from "./BarChart";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import Button from "./Button";

export default function TotalSales() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  const { totalSales, salesPerDay, salesPerWeek, salesPerMonth } =
    useSalesTracker(refId);

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
            <Button
              className="blue-btn"
              onClick={() => selectSalesRange("day")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              day
            </Button>
            <Button
              className="blue-btn"
              onClick={() => selectSalesRange("week")}
              style={{ marginRight: "2px", marginLeft: "2px" }}
            >
              week
            </Button>
            <Button
              className="blue-btn"
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
    </div>
  );
}
