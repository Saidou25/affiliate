import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
// import { useQuery } from "@apollo/client";
// import { QUERY_ME } from "../utils/queries";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import TotalBar from "./TotalBar";

import "./DetailedReport.css";
import { AffiliateSale } from "../types";
import { useState } from "react";
import Spinner from "./Spinner";
import { useMutation } from "@apollo/client";
import { MARK_SALE_HAS_PAID } from "../utils/mutations";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  role: string;
  __typename?: string;
}

type Props = {
  monthSales: AffiliateSale[];
  currentMonth: string;
  setShowReport: (item: number | null) => void;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  clicksData?: any;
  me: Affiliate;
};

export default function DetailedReportView({
  monthSales,
  currentMonth,
  setShowReport,
  salesPerMonth,
  clicksPerMonth,
  clicksData,
  me,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const addedSales = useAddMonthSales(monthSales);
  const { addedCommissions, calculateCommissionsByStatus } =
    useAddMonthCommissions(monthSales);

  // const [markSaleAsPaid] = useMutation(MARK_SALE_HAS_PAID, {
  //   update(cache, { data: { markSaleAsPaid } }) {
  //     try {
  //       // Read the current cache for sales (you may need to adjust the query)
  //       const id = cache.identify({
  //         __typename: "AffiliateSale",
  //         id: markSaleAsPaid.id, // Assuming your backend returns the `id`
  //       });

  //       cache.modify({
  //         id,
  //         fields: {
  //           commissionStatus() {
  //             return "paid"; // ✅ update status directly in cache
  //           },
  //         },
  //       });
  //     } catch (e) {
  //       console.error("Cache update error:", e);
  //     }
  //   },
  // });

  const [markSaleAsPaid] = useMutation(MARK_SALE_HAS_PAID);

  const findClicks = () => {
    const monthClicksArrAdmin = clicksData?.getAllAffiliatesClickLogs?.filter(
      (data: any) =>
        new Date(data.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }) === currentMonth
    );
    return monthClicksArrAdmin?.length;
  };

  const payNow = async (sale: AffiliateSale) => {
    setLoadingId(sale.id);
    const id = sale.id;
    console.log("🧪 Triggering markSaleAsPaid with saleId:", id, typeof id);
    if (!id || typeof id !== "string") {
      console.error("❌ Invalid saleId:", id);
      return;
    }

    try {
      const { data } = await markSaleAsPaid({
        variables: { saleId: id },
      });
      if (data) {
        console.log("payment successful!");
        setLoadingId(null);
      }
    } catch (error: any) {
      console.error("GraphQL error:", error.message);
      console.error("Full error object:", error);
    }
  };

  async function saveToPDF() {
    const element = document.getElementById("pdf-content");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;

    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    pdf.save("report.pdf");
  }

  return (
    <div className="print">
      <div className="">
        <div className="pis-container no-print">
          <div className="pdf-print-line">
            <PiFilePdfThin className="pifile" onClick={() => saveToPDF()} />
            <PiPrinterThin className="piprint" onClick={() => window.print()} />
          </div>
          <div className="close">
            <IoMdClose
              className="ioclose"
              onClick={() => setShowReport(null)}
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
          <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style-top">Purchase date</th>
                <th className="cell-style-top">Sale ID</th>
                <th className="cell-style-top">Buyer's email</th>
                <th className="cell-style-top">Product</th>
                <th className="cell-style-top">Product ID</th>
                <th className="cell-style-top">Reference ID</th>
                <th className="cell-style-top">Price</th>
                <th className="cell-style-top">Commission</th>
                <th className="cell-style-top">Action</th>
              </tr>
            </thead>
            <tbody>
              {monthSales &&
                monthSales?.map((sale, index) => (
                  <tr key={index}>
                    <td className="cell-style">
                      {new Date(sale.timestamp).toLocaleDateString("en-US", {
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td className="cell-style">{sale.id}</td>
                    <td className="cell-style">{sale.buyerEmail}</td>
                    <td className="cell-style">
                      {sale.event.length <= 20
                        ? sale.event
                        : `${sale.event.slice(0, 20)}...`}
                    </td>
                    <td className="cell-style">{sale.productId}</td>
                    <td className="cell-style">{sale.refId}</td>
                    <td className="cell-style">${sale.amount}</td>
                    <td className="cell-style">${sale.commissionEarned}</td>
                    <td className="cell-style">
                      <button
                        className={
                          sale?.commissionStatus === "paid"
                            ? "paid-button"
                            : "unpaid-button"
                        }
                        onClick={() => payNow(sale)}
                        disabled={loadingId === sale.id}
                      >
                        {loadingId === sale.id && <Spinner />}
                        {sale?.commissionStatus === "paid" &&
                          loadingId !== sale.id && <span>paid</span>}
                        {sale.commissionStatus === "unpaid" &&
                          loadingId !== sale.id && <span>pay</span>}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <>
            <TotalBar
              addedSales={addedSales()}
              addedCommissions={addedCommissions()}
              calculateCommissionsByStatus={calculateCommissionsByStatus()}
              currentMonth={currentMonth}
              salesPerMonth={salesPerMonth}
              clicksPerMonth={clicksPerMonth}
              monthSales={monthSales}
              findClicks={findClicks()}
              me={me}
            />
            <br />
          </>
        </div>
      </div>
    </div>
  );
}
