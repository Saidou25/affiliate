import { useQuery } from "@apollo/client";
import { GET_AFFILIATES, GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { useSalesTracker } from "../hooks/useSalesTracker";
import { Affiliate, AffiliateSale } from "../types";

import "./DetailedReport.css";
import ReusableTable from "./ReusableTable";

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
type Props = {
  refId: string;
};

// put this above your component
const formatDate = (value: any): Date | null => {
  if (!value) return null;

  // if it’s a number (stringified or not)
  const num = Number(value);
  if (!Number.isNaN(num)) {
    const ms = num < 1e12 ? num * 1000 : num; // seconds → ms
    return new Date(ms);
  }

  // otherwise assume ISO string
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export default function DetailedReport({ refId }: Props) {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);
  const [showReport, setShowReport] = useState<number | null>(null);

  const {
    data: salesData,
    // loading: salesLoading,
    // error: salesError,
    refetch,
  } = useQuery(GET_AFFILIATESALES, {
    variables: { filter: { refId }, limit: 200, offset: 0 },
    skip: !refId, // if refId is '', query won’t run
    fetchPolicy: "cache-and-network",
    // onCompleted: (d) => console.log("[AFFILIATE_SALES data]", d),
    // onError: (e) => console.error("[AFFILIATE_SALES error]", e),
  });

  const { data: affiliatesData } = useQuery(GET_AFFILIATES);

  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const { salesPerMonth } = useSalesTracker(refId);
  const { clicksPerMonth } = useClicksTracker();

  const findEmail = () => {
    if (affiliatesData) {
      const foundAffiliate = affiliatesData.getAffiliates.find(
        (affiliate: Affiliate) => affiliate.refId === refId
      );
      return foundAffiliate?.email ?? "Unknown email"; // Safe access
    }
    return "Unknown email";
  };

  findEmail();

  useEffect(() => {
    if (salesData?.getAffiliateSales) {
      const organizedDates = [...salesData?.getAffiliateSales].sort(
        (a, b) =>
          (formatDate(a.createdAt)?.getTime() ?? 0) -
          (formatDate(b.createdAt)?.getTime() ?? 0)
      );
      setSortedDates(organizedDates);
    }
  }, [salesData]);

  useEffect(() => {
    const salesMap: { [key: string]: AffiliateSale[] } = {};

    sortedDates.forEach((sale) => {
      const date = formatDate(sale.createdAt);
      if (!date) return; // skip if invalid
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
      const dateA = formatDate(a.sales[0].createdAt);
      const dateB = formatDate(b.sales[0].createdAt);
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    });

    setMonthlySales(groupedArray);
  }, [sortedDates]);

  if (!monthlySales?.length) {
    return (
      <div className="empty-state">
        {/* <img src="https://cdn.pixabay.com/photo/2016/03/31/20/53/analytics-1294847_1280.png"  alt="No reports" /> */}
        <h3>No Reports Available</h3>
        <p>
          Once you start generating clicks and sales, reports will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="detailed-report-container">
      {me.role === "admin" && monthlySales.length ? (
        <h3>Report for {findEmail()}</h3>
      ) : me.role === "affiliate" && monthlySales.length ? null : (
        <h2>Monthly Reports</h2>
      )}
      {monthlySales &&
        monthlySales.map((monthSales, index) => (
          <div className="" key={monthSales.month}>
            {showReport === index && (
              <ReusableTable
                monthSales={monthSales.sales}
                currentMonth={monthSales.month}
                setShowReport={setShowReport}
                salesPerMonth={salesPerMonth}
                clicksPerMonth={clicksPerMonth}
                refetchSales={refetch}
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
