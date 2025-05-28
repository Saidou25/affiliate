import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
// import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import TotalBar from "./TotalBar";

import "./DetailedReport.css";

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

type Props = {
  monthSales: AffiliateSale[];
  currentMonth: string;
  setShowReport: (item: number | null) => void;
  salesPerMonth?: any;
  clicksPerMonth?: any;
};

export default function DetailedReportView({
  monthSales,
  currentMonth,
  setShowReport,
  salesPerMonth,
  clicksPerMonth,
}: Props) {
  const addedSales = useAddMonthSales(monthSales);
  const addedCommissions = useAddMonthCommissions(monthSales);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

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
      <div className="res">
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
          <h2 style={{ color: "black" }}>Detailed Report for {currentMonth}</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style">Purchase date</th>
                <th className="cell-style">Buyer's email</th>
                <th className="cell-style">Product</th>
                <th className="cell-style">Product ID</th>
                <th className="cell-style">Reference ID</th>
                <th className="cell-style">Price</th>
                <th className="cell-style">Commission</th>
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
                    <td className="cell-style">{sale.buyerEmail}</td>
                    <td className="cell-style">{sale.event}</td>
                    <td className="cell-style">{sale.productId}</td>
                    <td className="cell-style">{sale.refId}</td>
                    <td className="cell-style">${sale.amount}</td>
                    <td className="cell-style">${sale.commissionEarned}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {me.role === "admin" && (
            <>
              <br />
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th className="cell-style">Month</th>
                    <th className="cell-style">Total Sales</th>
                    <th className="cell-style">Total Commissions</th>
                    <th className="cell-style">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cell-style">{currentMonth}</td>
                    <td className="cell-style">${addedSales()}</td>
                    <td className="cell-style">${addedCommissions()}</td>
                    <td className="cell-style">
                      ${addedSales() - addedCommissions()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {me.role === "affiliate" && (
            <TotalBar
              addedSales={addedSales()}
              addedCommissions={addedCommissions()}
              currentMonth={currentMonth}
              salesPerMonth={salesPerMonth}
              clicksPerMonth={clicksPerMonth}
            />
          )}
        </div>
      </div>
    </div>
  );
}
