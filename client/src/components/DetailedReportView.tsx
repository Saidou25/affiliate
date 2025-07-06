import { useEffect, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { RECORD_AFFILIATE_PAYMENT } from "../utils/mutations";
import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { Affiliate, AffiliateSale } from "../types";
import {
  CHECK_STRIPE_STATUS,
  GET_AFFILIATE_BY_REFID,
  GET_AFFILIATES,
  QUERY_ME,
} from "../utils/queries";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import TotalBar from "./TotalBar";
import Spinner from "./Spinner";

import "./DetailedReport.css";
// import { useGetOneAffiliate } from "../hooks/useGetOneAffiliate";

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
  //  Create a state to track Stripe statuses per affiliate
  const [stripeStatusMap, setStripeStatusMap] = useState<
    Record<string, boolean>
  >({});
  const [stripeLoadingMap, setStripeLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  // const [showStripeMessage, setShowStripeMessage] = useState(false);
  // const [redirectUrl, setRedirectUrl] = useState("");

  const addedSales = useAddMonthSales(monthSales);
  const { addedCommissions, calculateCommissionsByStatus } =
    useAddMonthCommissions(monthSales);

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { data: affiliatesData } = useQuery(GET_AFFILIATES);
  const [recordAffiliatePayment] = useMutation(RECORD_AFFILIATE_PAYMENT);
  const [getAffiliateByRefId] = useLazyQuery(GET_AFFILIATE_BY_REFID);
  const [checkStripeStatus] = useLazyQuery(CHECK_STRIPE_STATUS);

  const payNow = async (sale: AffiliateSale, affiliateId: string) => {
    setLoadingId(sale.id);
    const id = sale.id;
    // let affiliateId;
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

  const handleClick = async (sale: AffiliateSale) => {
    try {
      const { data } = await getAffiliateByRefId({
        variables: { refId: sale.refId },
      });
      const affiliateId = data?.getAffiliateByRefId?.id;
      if (!affiliateId) return;

      const { data: stripeData } = await checkStripeStatus({
        variables: { affiliateId },
      });
      const isReady =
        stripeData?.checkStripeStatus?.charges_enabled &&
        stripeData?.checkStripeStatus?.payouts_enabled;

      if (!isReady) {
        alert("Affiliate not ready for payouts.");
        return;
      }

      payNow(sale, affiliateId);
    } catch (err: any) {
      console.error("❌ Failed to process payout:", err.message);
    }
  };

  const handleCheckEnrollment = async (refId: string) => {
    setStripeLoadingMap((prev) => ({ ...prev, [refId]: true }));
    try {
      const affiliateResult = await getAffiliateByRefId({
        variables: { refId },
      });
      const affiliateId = affiliateResult?.data?.getAffiliateByRefId?.id;

      if (!affiliateId) {
        setStripeStatusMap((prev) => ({ ...prev, [refId]: false }));
        setStripeLoadingMap((prev) => ({ ...prev, [refId]: false }));
        return;
      }

      const stripeResult = await checkStripeStatus({
        variables: { affiliateId },
      });
      const stripeStatus = stripeResult?.data?.checkStripeStatus;

      const ready =
        stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled;

      setStripeStatusMap((prev) => ({ ...prev, [refId]: ready }));
    } catch (err) {
      console.error("Error checking Stripe enrollment:", err);
      setStripeStatusMap((prev) => ({ ...prev, [refId]: false }));
    } finally {
      setStripeLoadingMap((prev) => ({ ...prev, [refId]: false }));
    }
  };

  // useEffect to trigger checks on render
  useEffect(() => {
    const sales = monthSales as AffiliateSale[];
    const uniqueRefIds = Array.from(new Set(sales.map((sale) => sale.refId)));

    uniqueRefIds.forEach((refId) => {
      if (!(refId in stripeStatusMap)) {
        handleCheckEnrollment(refId);
      }
    });
  }, [monthSales, stripeStatusMap]);

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
                {/* <th className="cell-style-top">Sale ID</th> */}
                <th className="cell-style-top">Buyer's email</th>
                <th className="cell-style-top">Product</th>
                {/* <th className="cell-style-top">Product ID</th> */}
                <th className="cell-style-top">Reference ID</th>
                <th className="cell-style-top">Price</th>
                <th className="cell-style-top">Commission</th>
                {/* <th className="cell-style-top">
                  {status ? (
                    status.charges_enabled && status.payouts_enabled ? (
                      <p>✅ Ready for Payouts</p>
                    ) : (
                      <p>⚠️ Not payout-ready yet</p>
                    )
                  ) : (
                    <p>Loading status...</p>
                  )}
                </th> */}

                <th className="cell-style-top">Enrolled</th>
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
                    {/* <td className="cell-style">{sale.id}</td> */}
                    <td className="cell-style">{sale.buyerEmail}</td>
                    <td className="cell-style">
                      {sale.event.length <= 20
                        ? sale.event
                        : `${sale.event.slice(0, 20)}...`}
                    </td>
                    {/* <td className="cell-style">{sale.productId}</td> */}
                    <td className="cell-style">{sale.refId}</td>
                    <td className="cell-style">${sale.amount}</td>
                    <td className="cell-style">${sale.commissionEarned}</td>
                    {/* Update the cell to show status of enrollement */}
                    <td className="cell-style">
                      {stripeLoadingMap[sale.refId] ? (
                        <Spinner />
                      ) : stripeStatusMap[sale.refId] === true ? (
                        <span style={{ color: "green" }}>✅ Ready</span>
                      ) : (
                        <span style={{ color: "orange" }}>⚠️ Not ready</span>
                      )}
                    </td>

                    <td className="cell-style">
                      <button
                        className={
                          sale?.commissionStatus === "paid"
                            ? `paid-button-${me?.role}`
                            : `unpaid-button-${me?.role}`
                        }
                        onClick={() => handleClick(sale)}
                        disabled={
                          loadingId === sale.id ||
                          sale.commissionStatus === "paid" ||
                          me?.role === "affiliate" ||
                          stripeStatusMap[sale.refId] === false ||
                          stripeStatusMap[sale.refId] === undefined
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
