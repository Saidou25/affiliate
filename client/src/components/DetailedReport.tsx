import { useQuery } from "@apollo/client";
import { GET_AFFILIATES, GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { useSalesTracker } from "../hooks/useSalesTracker";
import { Affiliate, AffiliateSale } from "../types";
import DetailedReportView from "./DetailedReportView";

import "./DetailedReport.css";

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
type Props = {
  refId: string;
};

export default function DetailedReport({ refId }: Props) {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);
  const [showReport, setShowReport] = useState<number | null>(null);

  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId },
    skip: !refId,
  });

  const { data: affiliatesData } = useQuery(GET_AFFILIATES);

  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const { salesPerMonth } = useSalesTracker(refId);
  const { clicksPerMonth } = useClicksTracker();

  const findEmail = () => {
    if (affiliatesData) {
      const foundAffiliate = affiliatesData.getAffiliates.filter(
        (affiliate: Affiliate) => affiliate.refId === refId
      );
      return foundAffiliate[0].email;
    }
  };

  findEmail();

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
    <div className="detailed-report-container">
      {me.role === "admin" ? (
        <h3>Report for {findEmail()}</h3>
      ) : (
        <h2>Monthly Reports</h2>
      )}
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
              <div className="view-line-div">
                📄
                <span
                  className="view-line"
                  onClick={() => setShowReport(index)}
                >
                  {monthSales.month} detailed report
                </span>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
