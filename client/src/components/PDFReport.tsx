import { useQuery } from "@apollo/client";
import {
  GET_ALLAFFILIATESALES,
  GET_ALLAFFILIATESCLICKLOGS,
} from "../utils/queries";
import { useState } from "react";
import { AffiliateSale } from "../types";
import DetailedReportView from "./DetailedReportView";
import useSalesReport from "../hooks/useSalesReport";
import PaymentsReports from "./PaymentsReports";
import PaidCommissions from "./PaidCommissions";
import UnpaidCommissions from "./UnpaidCommissions";

export default function PDFReport() {
  const [showReport, setShowReport] = useState<number | null>(null);
  const {
    data: salesData,
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
