import { useQuery } from "@apollo/client";
import {
  GET_ALLAFFILIATESALES,
  GET_ALLAFFILIATESCLICKLOGS,
} from "../utils/queries";
import { useState } from "react";
import DetailedReportView from "./DetailedReportView";
import useSalesReport from "../hooks/useSalesReport";
import { AffiliateSale } from "../types";
// import PaymentsReports from "./PaymentsReports";
// import PaidCommissions from "./PaidCommissions";
// import UnpaidCommissions from "./UnpaidCommissions";

export default function AffiliatesSalesReport() {
  const [showReport, setShowReport] = useState<number | null>(null);
  const {
    data: salesData,
    refetch,
    // loading: loadingAffiliateSales,
    // error: errorAffiliateSales,
  } = useQuery<{ getAllAffiliateSales: AffiliateSale[] }>(
    GET_ALLAFFILIATESALES
  );

  // const { data } = useQuery(QUERY_ME);
  // const me = data?.me || {};

  const { data: clicksData } = useQuery(GET_ALLAFFILIATESCLICKLOGS);

  const { monthlySales } = useSalesReport(salesData);
  // console.log("monthly sales: ", monthlySales);

  return (
    <div className="">
      <h2>Monthly Reports</h2>
      <div className="">
        {monthlySales &&
          monthlySales.map((monthSales, index) => (
            <div className="" key={monthSales.month}>
              {showReport === index && (
                <DetailedReportView
                  monthSales={monthSales.sales}
                  currentMonth={monthSales.month}
                  setShowReport={setShowReport}
                  clicksData={clicksData}
                   refetchSales={refetch}
                />
              )}
              {showReport === null && (
                <>
                  {/* {monthSales.month === key ? <span>most rescent report</span> : <span>previous reports</span>} */}
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
      </div>
      {/* {me.role === "admin" && ( */}
      <>
        {/* <h2>Payment Reports(commission paid for the current month):</h2> */}
        {/* <PaymentsReports /> */}
        {/* <h2>Paid commissions</h2> */}
        {/* <PaidCommissions /> */}
        {/* <h2>Unpaid commissions</h2> */}
        {/* <UnpaidCommissions /> */}
      </>
      {/* )} */}
    </div>
  );
}
