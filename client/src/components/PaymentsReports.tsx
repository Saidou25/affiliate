import { useMutation, useQuery } from "@apollo/client";
import {
  GET_ALL_PAYMENTS,
  // GET_ALLAFFILIATESALES,
  // GET_ALLAFFILIATESCLICKLOGS,
} from "../utils/queries";
// import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
// import { IoMdClose } from "react-icons/io";
// import useAddMonthSales from "../hooks/useAddMonthSales";
// import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
// import useSalesReport from "../hooks/useSalesReport";
// import { AffiliateSale } from "../types";
import { useEffect, useState } from "react";
import { SAVE_HTML_REPORT } from "../utils/mutations";

export default function SalesReport() {
  // const [monthSales, setMonthSales] = useState<AffiliateSale[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const [enableSaveReport, setEnableSaveReport] = useState(false);

  const { data, error: paymentError } = useQuery(GET_ALL_PAYMENTS);

  // const {
  //   data: salesData,
  //   // loading: loadingAffiliateSales,
  //   // error: errorAffiliateSales,
  // } = useQuery<{ getAllAffiliateSales: AffiliateSale[] }>(
  //   GET_ALLAFFILIATESALES
  // );

  // const { data: clicksData } = useQuery(GET_ALLAFFILIATESCLICKLOGS);

  const [saveHtmlReport] = useMutation(SAVE_HTML_REPORT);

  const currentMonth = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    year: "numeric",
  });

  // const { monthlySales } = useSalesReport(salesData);
  // console.log(monthlySales);
  // const addedSales = useAddMonthSales(monthSales);
  // const { addedCommissions, calculateCommissionsByStatus } =
  //   useAddMonthCommissions(monthSales);

  // const findClicks = () => {
  //   const monthClicksArrAdmin = clicksData?.getAllAffiliatesClickLogs?.filter(
  //     (data: any) =>
  //       new Date(data.createdAt).toLocaleDateString("en-US", {
  //         month: "long",
  //         year: "numeric",
  //       }) === currentMonth
  //   );
  //   return monthClicksArrAdmin?.length;
  // };

  // useEffect(() => {
  //   if (monthlySales) {
  //     for (let m of monthlySales) {
  //       if (m.month === currentMonth) {
  //         // console.log("current month: ", m.sales);
  //         const sales = m.sales;
  //         setMonthSales(sales as AffiliateSale[]);
  //       }
  //     }
  //   }
  //   // setMonthSales()
  // }, [monthlySales, currentMonth, setMonthSales]);

  useEffect(() => {
    // console.log(data);
  }, [data]);

  const SaveHtmlReport = async () => {
    setLoading(true);
    const htmlElement = document.getElementById("pdf-content");
    if (!htmlElement) return;

    const htmlContent = htmlElement.outerHTML;

    try {
      await saveHtmlReport({
        variables: {
          html: htmlContent,
          month: currentMonth,
        },
      });
      setLoading(false);
      setSuccess("✅ Report saved successfully!");
    } catch (err) {
      setError("❌ Failed to save report:");
      // console.log("❌ Failed to save report:", err);
      // alert("Error saving report");
      setLoading(false);
    }
  };

  if (error) return <p>{paymentError?.message}</p>;
  return (
    <div className="print">
        <h2>Payments' status for the month</h2>
      <br />
      <div className="res">
        <div style={{ display: "flex" }}>
          <h3 style={{ marginRight: "2%" }}>
            All commissions for {currentMonth} are paid, sale's report is ready
            to be archived.
          </h3>
          <button
            onClick={() => SaveHtmlReport()}
            // disabled={loading || !enableSaveReport}
             disabled={loading}
          >
            {loading && <span>Loading...</span>}
            {error && <span>{error}</span>}
            {success && <span>{success}</span>}
            {!loading && !error && !success && <span>Archive Report</span>}
          </button>
        </div>
      </div>
      <br />
      {/* <h2>Payment Reports(commission paid for the current month):</h2>
      <br />
      <div className="res">
        <h3>
          So far {data?.getAllPayments?.length} payments were maid for{" "}
          {currentMonth}
        </h3>
        <br />
        <div className="pis-container no-print">
          <div className="pdf-print-line">
            <PiFilePdfThin
              className="pifile"
              // onClick={() => saveToPDF()}
            />
            <PiPrinterThin
              className="piprint"
              // onClick={() => window.print()}
            />
          </div>
          <div className="close">
            <IoMdClose
              className="ioclose"
              // onClick={() => setShowReport(null)}
            />
          </div>
        </div>
        <div
          id="pdf-content"
          style={{
            padding: "2%",
            borderRadius: "10px",
            backgroundColor: "rgb(243, 238, 220)",
          }}
        >
          {/* <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3> */}

          {/* <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style-top">Payment date</th>
                <th className="cell-style-top">Payment ID</th>
                <th className="cell-style-top">Payment method</th>
                {/* <th className="cell-style-top">Transaction ID</th> */}
                {/* <th className="cell-style-top">Sale ID</th>
                <th className="cell-style-top">Affiliate ID</th>
                <th className="cell-style-top">Product</th>
                <th className="cell-style-top">Sale Amount</th>
                <th className="cell-style-top">Paid Commission</th> */}
                {/* <th className="cell-style-top">note</th> */}
                {/* <th className="cell-style-top">Action</th> */}
              {/* </tr>
            </thead>
            <tbody>
              {data?.getAllPayments &&
                data?.getAllPayments?.map((payment: any, index: number) => (
                  <tr key={index}>
                    <td className="cell-style">
                      {new Date(payment.date).toLocaleDateString("en-US", {
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td className="cell-style">{payment.id}</td>
                    <td className="cell-style">{payment.method}</td> */}
                    {/* <td className="cell-style">
                      {payment.event.length <= 20
                        ? payment.event
                        : `${payment.event.slice(0, 20)}...`}
                    </td> */}
                    {/* <td className="cell-style">{payment.id}</td> */}
                    {/* <td className="cell-style">{payment.saleIds[0]}</td> */}
                    {/* <td className="cell-style">{payment.affiliateId}</td>
                    <td className="cell-style">{payment?.productName}</td>
                    <td className="cell-style">${payment.saleAmount}</td>
                    <td className="cell-style">${payment.paidCommission}</td> */}
                    {/* <td className="cell-style">{payment.notes}</td> */}
                  {/* </tr>
                ))}
            </tbody>
          </table>
          <br />
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style">Month</th>
                <th className="cell-style">Total Clicks</th>
                <th className="cell-style">Total Sales</th>
                <th className="cell-style">Total Sales Amount</th>
                <th className="cell-style">Total Commissions</th>
                <th className="cell-style">Unpaid Commissions</th>
                <th className="cell-style">Paid Commissions</th>
                <th className="cell-style">Earnings</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-style">{currentMonth}</td>
                <td className="cell-style">{findClicks()}</td>
                <td className="cell-style">{monthSales?.length}</td>
                <td className="cell-style">${addedSales()}</td>
                <td className="cell-style">${addedCommissions()}</td>
                <td className="cell-style">
                  ${calculateCommissionsByStatus().unpaid}
                </td>
                <td className="cell-style">
                  ${calculateCommissionsByStatus().paid}
                </td>
                <td className="cell-style">
                  $
                  {(addedSales() - calculateCommissionsByStatus().paid).toFixed(
                    2
                  )}
                </td>
              </tr>
            </tbody>
          </table> */}
        {/* </div> */} 
      {/* </div> */} 
    </div>
  );
}
