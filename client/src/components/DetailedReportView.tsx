import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { RECORD_AFFILIATE_PAYMENT } from "../utils/mutations";
import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { Affiliate, AffiliateSale } from "../types";
import { GET_AFFILIATES, QUERY_ME } from "../utils/queries";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import TotalBar from "./TotalBar";
import Spinner from "./Spinner";

import "./DetailedReport.css";

type Props = {
  monthSales: any;
  currentMonth: string;
  setShowReport: (item: number | null) => void;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  clicksData?: any;
};

export default function DetailedReportView({
  monthSales,
  currentMonth,
  setShowReport,
  salesPerMonth,
  clicksPerMonth,
  clicksData,
}: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const addedSales = useAddMonthSales(monthSales);
  const { addedCommissions, calculateCommissionsByStatus } =
    useAddMonthCommissions(monthSales);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { data: affiliatesData } = useQuery(GET_AFFILIATES);
  const [recordAffiliatePayment] = useMutation(RECORD_AFFILIATE_PAYMENT);

  const payNow = async (sale: AffiliateSale) => {
    setLoadingId(sale.id);
    const id = sale.id;
    let affiliateId;
    if (!id || typeof id !== "string") {
      console.error("❌ Invalid saleId:", id);
      return;
    }

    if (affiliatesData) {
      const foundAffiliate = affiliatesData.getAffiliates.find(
        (affiliate: Affiliate) => affiliate.refId === sale.refId
      );
      affiliateId = foundAffiliate.id;
    }

    try {
      const { data } = await recordAffiliatePayment({
        variables: {
          input: {
            refId: sale.refId,
            saleIds: sale.id,
            affiliateId,
            saleAmount: sale.amount,
            method: "bank",
            transactionId: "BANK-TRX-123",
            notes: `${currentMonth} payout for ${sale.refId}`,
          },
        },
      });

      if (data) {
        console.log("✅ Payment successful!");
        setLoadingId(null);
        // Optionally: refresh your sales list here!
      }
    } catch (error: any) {
      console.error("GraphQL error:", error.message);
      console.error("Full error object:", error);
    }
  };

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
                <th className="cell-style-top">
                  {me?.role === "admin" ? (
                    <span className="">Action</span>
                  ) : (
                    <span className="">Status</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {monthSales &&
                monthSales?.map((sale: any, index: number) => (
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
                            ? `paid-button-${me?.role}`
                            : `unpaid-button-${me?.role}`
                        }
                        onClick={() => payNow(sale)}
                        disabled={
                          loadingId === sale.id ||
                          sale.commissionStatus === "paid" ||
                          me?.role === "affiliate"
                        }
                      >
                        {loadingId === sale.id && <Spinner />}
                        {sale?.commissionStatus === "paid" &&
                          loadingId !== sale.id && <span>paid</span>}
                        {me?.role === "admin" &&
                          sale.commissionStatus === "unpaid" &&
                          loadingId !== sale.id && <span>pay</span>}
                        {me?.role === "affiliate" &&
                          sale.commissionStatus === "unpaid" &&
                          loadingId !== sale.id && <span>unpaid</span>}
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
