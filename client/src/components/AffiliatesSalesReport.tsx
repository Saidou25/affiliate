import { useQuery } from "@apollo/client";
import { GET_ALLAFFILIATESALES, GET_ALLAFFILIATESCLICKLOGS } from "../utils/queries";
import { useState } from "react";
import DetailedReportView from "./DetailedReportView";
import useSalesReport from "../hooks/useSalesReport";

interface AffiliateSale {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  timestamp: string;
  amount: number;
  productId: string;
  __typename?: string; // Optional if you're not using it
}

export default function AffiliatesSalesReport() {
  const [showReport, setShowReport] = useState<number | null>(null);
  const {
    data: salesData,
    // loading: loadingAffiliateSales,
    // error: errorAffiliateSales,
  } = useQuery<{ getAllAffiliateSales: AffiliateSale[] }>(
    GET_ALLAFFILIATESALES
  );

  const { data: clicksData } = useQuery(GET_ALLAFFILIATESCLICKLOGS);

  const { monthlySales } = useSalesReport(salesData);


  return (
    <div className="">
      <h2>Reports</h2>
      <div className="res">
        {monthlySales &&
          monthlySales.map((monthSales, index) => (
            <div className="" key={monthSales.month}>
              {showReport === index && (
                <DetailedReportView
                  monthSales={monthSales.sales}
                  currentMonth={monthSales.month}
                  setShowReport={setShowReport}
                  clicksData={clicksData}
                />
              )}
              {showReport === null && (
                <>
                  {/* {monthSales.month === key ? <span>most rescent report</span> : <span>previous reports</span>} */}
                  <span
                    className="view-line"
                    onClick={() => setShowReport(index)}
                  >
                    {monthSales.month} detailed report
                  </span>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
