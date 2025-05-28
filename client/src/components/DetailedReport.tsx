import { useQuery } from "@apollo/client";
import { GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";
import { useClicksTracker } from "../hooks/useClicksTracker";
import DetailedReportView from "./DetailedReportView";

import "./DetailedReport.css";
import { useSalesTracker } from "../hooks/useSalesTracker";

interface AffiliateSale {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  timestamp: string;
  amount: number;
  productId: string;
  __typename?: string;
}

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
export default function DetailedReport() {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);
  const [showReport, setShowReport] = useState<number | null>(null);

  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};
  const refId = me?.refId;

  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId },
    skip: !refId,
  });

  const { salesPerMonth } = useSalesTracker();
  const { clicksPerMonth } = useClicksTracker();

  // console.log("totalSales:", totalSales)
  // console.log("clicksPerDay:", clicksPerDay)
  // console.log("clicksPerWeek:", clicksPerWeek)
  // console.log("clicksPerMonth:", clicksPerMonth);

  useEffect(() => {
    if (salesData?.getAffiliateSales) {
      const organizedDates = [...salesData?.getAffiliateSales].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setSortedDates(organizedDates);
    }
  }, [salesData]);

  useEffect(() => {
    const salesMap: { [key: string]: AffiliateSale[] } = {};

    sortedDates.forEach((sale) => {
      const date = new Date(sale.timestamp);
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!salesMap[key]) {
        salesMap[key] = [];
      }
      salesMap[key].push(sale);
    });

    const groupedArray: MonthlySalesGroup[] = Object.entries(salesMap).map(
      ([month, sales]) => ({
        month,
        sales,
      })
    );

    // sort by most recent month
    groupedArray.sort((a, b) => {
      const dateA = new Date(a.sales[0].timestamp);
      const dateB = new Date(b.sales[0].timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    setMonthlySales(groupedArray);
  }, [sortedDates]);

  return (
    <>
      <h2>Reports</h2>
      {monthlySales &&
        monthlySales.map((monthSales, index) => (
          <div className="" key={monthSales.month}>
            {showReport === index && (
              <DetailedReportView
                monthSales={monthSales.sales}
                currentMonth={monthSales.month}
                setShowReport={setShowReport}
                salesPerMonth={salesPerMonth}
                clicksPerMonth={clicksPerMonth}
              />
            )}
            {showReport === null && (
              <span className="view-line" onClick={() => setShowReport(index)}>
                {monthSales.month} detailed report
              </span>
            )}
          </div>
        ))}
    </>
  );
}
