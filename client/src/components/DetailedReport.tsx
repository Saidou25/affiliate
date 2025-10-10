import { useQuery } from "@apollo/client";
import { GET_AFFILIATES, GET_AFFILIATESALES } from "../utils/queries";
import { useEffect, useState } from "react";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { useSalesTracker } from "../hooks/useSalesTracker";
import { Affiliate, AffiliateSale } from "../types";
import ReusableTable from "./ReusableTable";
import DetailedReportSkeleton from "./DetailedReportSkeleton";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { useOutletContext } from "react-router-dom";

import "./DetailedReport.css";
import { FiBarChart2 } from "react-icons/fi";

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
// type Props = {
//     me: Affiliate;
//    onboardingStatus?: AffiliateOutletContext["onboardingStatus"];
// };

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

export default function DetailedReport() {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);
  const [showReport, setShowReport] = useState<number | null>(null);
  const [dataReady, setDataReady] = useState(false);

  const { me, refId } = useOutletContext<AffiliateOutletContext>();

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

  const { salesPerMonth } = useSalesTracker(refId ?? "");
  const { clicksPerMonth } = useClicksTracker();

  // console.log(salesPerMonth);

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

  useEffect(() => {
    if (monthlySales.length) {
      setTimeout(() => {
        setDataReady(true);
      }, 1000);
    }
  }, [monthlySales]);

  if (!dataReady && monthlySales?.length) {
    return <DetailedReportSkeleton />;
  }

  if (!dataReady && !monthlySales?.length) {
    return (
      <div className="empty-state">
      <FiBarChart2 size={64} className="opacity-60" aria-hidden />
        <h3>No Reports Available</h3>
        <p>Once you start generating sales, reports will appear here.</p>
      </div>
    );
  }

  return (
    <div className="detailed-report-container">
      {dataReady && me?.role === "affiliate" && showReport === null ? (
        <h2>Monthly Reports</h2>
      ) : null}
      <br />
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
