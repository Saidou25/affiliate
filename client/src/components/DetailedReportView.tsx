import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { AffiliateSale } from "../types";
// import type { AffiliateSale } from "../types";
import { QUERY_ME } from "../utils/queries";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import useFetchStripeStatusByRefId from "../hooks/useFetchStripeStatusByRefId";
import TotalBar from "./TotalBar";
import Spinner from "./Spinner";
import Button from "./Button";
import useStripePayout from "../hooks/useStripePayout";
import { ADD_AFFILIATE_PAYMENT } from "../utils/mutations";

import "./DetailedReport.css";

type Props = {
  monthSales: AffiliateSale[];
  currentMonth: string;
  setShowReport: (item: number | null) => void;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  clicksData?: any;
  refetchSales?: () => Promise<any>;
};

export default function DetailedReportView({
  monthSales,
  currentMonth,
  setShowReport,
  salesPerMonth,
  clicksPerMonth,
  clicksData,
  refetchSales,
}: Props) {
  const [refIdsArr, setRefIdsArr] = useState<string[]>([]);

  const stripeReadyArr = useFetchStripeStatusByRefId(refIdsArr);

  const addedSales = useAddMonthSales(monthSales);
  const { addedCommissions, calculateCommissionsByStatus } =
    useAddMonthCommissions(monthSales);

  const { processingId, paySale, error } = useStripePayout({
    currentMonth,
    onAfterSuccess: async () => {
      if (refetchSales) await refetchSales();
    },
  });

  const [addAffiliatePayment, { error: errorPayment }] = useMutation(
    ADD_AFFILIATE_PAYMENT
  );
  console.log("error: ", errorPayment);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const handleClick = async (sale: AffiliateSale) => {
    const refId = sale?.refId;
    const payment = {
      saleAmount: 1.0,
      paidCommission: 2.0,
      date: new Date().toISOString(),
      method: "bank",
      productName: "August commissions",
      transactionId: "BANK-12345",
      notes: "Manual payout one",
    };
    try {
      await paySale(sale);
      await addAffiliatePayment({
        variables: { refId, payment },
      });
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : JSON.stringify(error);

      console.log("Affiliate not ready for payouts or payment failed:", msg);
    }
  };

  useEffect(() => {
    if (!monthSales) return;
    const unique = Array.from(
      new Set(monthSales.map((s) => s?.refId).filter(Boolean) as string[])
    );
    setRefIdsArr(unique);
  }, [monthSales]);

  const findClicks = () => {
    const monthClicksArrAdmin = clicksData?.getAllAffiliatesClickLogs?.filter(
      (d: any) =>
        new Date(d.createdAt).toLocaleDateString("en-US", {
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

        {error && (
          <div className="alert error no-print" style={{ margin: "8px 0" }}>
            {error}
          </div>
        )}

        <div
          id="pdf-content"
          style={{
            padding: "2%",
            borderRadius: "10px",
          }}
        >
          <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3>
          <br />
          <br />
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style-top">Purchase date</th>
                <th className="cell-style-top">Item</th>
                <th className="cell-style-top">Woo Product ID</th>
                <th className="cell-style-top">Price</th>
                <th className="cell-style-top">Order Id</th>
                <th className="cell-style-top"> Affiliate ref Id</th>
                <th className="cell-style-top">Commission Earned</th>
                {me.role === "admin" && (
                  <th className="cell-style-top">Enrolled</th>
                )}
                <th className="cell-style-top">
                  {me?.role === "admin" ? "Action" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {monthSales?.map((sale: any, index: number) => {
                const unitPrice =
                  typeof sale?.items?.[0]?.unitPrice === "number"
                    ? sale.items[0].unitPrice
                    : Number(sale?.items?.[0]?.unitPrice ?? 0);

                return (
                  <tr key={index}>
                    <td className="cell-style">
                      {new Date(sale.createdAt).toLocaleDateString("en-US", {
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td className="cell-style">{sale.product}</td>
                    <td className="cell-style">
                      {sale.items?.[0]?.wooProductId ?? "—"}
                    </td>
                    <td className="cell-style">${unitPrice.toFixed(2)}</td>
                    <td className="cell-style">{sale.orderId}</td>
                    <td className="cell-style">{sale.refId}</td>
                    <td className="cell-style">
                      ${Number(sale.commissionEarned ?? 0).toFixed(2)}
                    </td>

                    {me.role === "admin" && (
                      <td className="cell-style">
                        {stripeReadyArr.includes(sale.refId) ? (
                          <span style={{ color: "green" }}>✅ Ready</span>
                        ) : (
                          <span style={{ color: "orange" }}>⚠️ Not ready</span>
                        )}
                      </td>
                    )}

                    <td className="cell-style">
                      <Button
                        className={
                          sale?.commissionStatus === "paid"
                            ? `paid-button-${me?.role}`
                            : !stripeReadyArr.includes(sale.refId)
                            ? `unpaid-button-not-ready-${me?.role}`
                            : `unpaid-button-${me?.role}`
                        }
                        onClick={() => handleClick(sale)}
                        disabled={
                          processingId === sale.id ||
                          sale.commissionStatus === "paid" ||
                          me?.role === "affiliate" ||
                          !stripeReadyArr.includes(sale.refId)
                        }
                      >
                        {processingId === sale.id && <Spinner />}
                        {sale?.commissionStatus === "paid" &&
                          processingId !== sale.id && <span>paid</span>}
                        {me?.role === "admin" &&
                          sale.commissionStatus === "unpaid" &&
                          processingId !== sale.id && <span>pay</span>}
                        {me?.role === "affiliate" &&
                          sale.commissionStatus === "unpaid" &&
                          processingId !== sale.id && <span>unpaid</span>}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
        </div>
      </div>
    </div>
  );
}
