import { useQuery } from "@apollo/client";
import {
  GET_ALLAFFILIATESALES,
  GET_ALLAFFILIATESCLICKLOGS,
  QUERY_ME,
  // QUERY_ME,
  // SINGLE_AFFILIATE_SALES,
} from "../utils/queries";
import { useState } from "react";
// import DetailedReportView from "./DetailedReportView";
import useSalesReport from "../hooks/useSalesReport";
import { AffiliateSale } from "../types";
import ReusableTable from "./ReusableTable";
// import SalesAdapter from "./SalesAdapter";
// import SalesTable from "./SalesAdapter";
// import PaymentsReports from "./PaymentsReports";
// import PaidCommissions from "./PaidCommissions";
// import UnpaidCommissions from "./UnpaidCommissions";

export default function AffiliatesSalesReport() {
  const [showReport, setShowReport] = useState<number | null>(null);
   const { data: meData } = useQuery(QUERY_ME);
    const me = meData?.me || {};
  const {
    data: salesData,
    refetch,
    // loading: loadingAffiliateSales,
    // error: errorAffiliateSales,
  } = useQuery<{ getAllAffiliateSales: AffiliateSale[] }>(
    GET_ALLAFFILIATESALES
  );

  const { data: clicksData } = useQuery(GET_ALLAFFILIATESCLICKLOGS);

  const { monthlySales } = useSalesReport(salesData);

  return (
    <>
    {me.role === "admin" && (showReport === null) ? <h2>Monthly Reports</h2> : null}
      <br />
      {monthlySales &&
        monthlySales.map((monthSales, index) => (
          <div className="" key={monthSales.month}>
            {showReport === index && (
              <>
                <br />
                <br />
                <ReusableTable
                  monthSales={monthSales.sales}
                  currentMonth={monthSales.month}
                  setShowReport={setShowReport}
                  clicksData={clicksData}
                  refetchSales={refetch}
                />
              </>
            )}
            {showReport === null && (
              <>
                <span>📄</span>
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
    </>
  );
}
