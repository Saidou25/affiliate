import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
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
  commissionStatus: string;
  timestamp: string | Date;
  amount: number;
  productId: string;
  __typename?: string;
}

type Props = {
  monthSales: AffiliateSale[];
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
  const addedSales = useAddMonthSales(monthSales);
  const addedCommissions = useAddMonthCommissions(monthSales);
  console.log(monthSales);
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
                      >
                        {sale?.commissionStatus === "paid" ? (
                          <span>paid</span>
                        ) : (
                          <span>pay</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {me.role === "admin" && (
            <>
              <TotalBar
                addedSales={addedSales()}
                addedCommissions={addedCommissions()}
                currentMonth={currentMonth}
                // salesPerMonth={salesPerMonth}
                clicksPerMonth={clicksPerMonth}
                monthSales={monthSales}
                findClicks={findClicks()}
              />
              <br />
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
