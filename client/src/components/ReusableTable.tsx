import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { IoMdClose } from "react-icons/io";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import type { AffiliateSale, Affiliate } from "../types";
import { QUERY_ME } from "../utils/queries";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import useAddMonthSales from "../hooks/useAddMonthSales";
import useAddMonthCommissions from "../hooks/useAddMonthCommissions";
import useFetchStripeStatusByRefId from "../hooks/useFetchStripeStatusByRefId";
import TotalBar from "./TotalBar";
import RowActions from "./RowAction";
import { StatusChips } from "./StatusChip";
import useCommissionTransfer from "../hooks/useCommissionTransfer";
import { normalizeCommissionStatus } from "../utils/commission";

import "./DetailedReport.css";

export type FieldKey =
  | "purchaseDate"
  | "item"
  | "wooProductId"
  | "price"
  | "orderId"
  | "status"
  | "transferId"
  | "refId"
  | "commission"
  | "enrolled"
  | "actionOrStatus";

export type FieldConfig = {
  key: FieldKey;
  label?: string;
  visible?: boolean;
};

export type FieldsProp =
  | FieldKey[]
  | { admin?: FieldKey[]; affiliate?: FieldKey[] }
  | FieldConfig[]
  | { admin?: FieldConfig[]; affiliate?: FieldConfig[] };

// ---- Props (matches old DetailedReportView, plus fields & labels) ----
export type ReportTableProps = {
  monthSales: AffiliateSale[];
  currentMonth: string;
  setShowReport: (item: number | null) => void;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  clicksData?: any;
  refetchSales?: () => Promise<any>;
  fields?: FieldsProp;
  forceRole?: Affiliate["role"];
  titleOverride?: string;
  summaryTitleOverride?: string;
};

export default function ReusableTable({
  monthSales,
  currentMonth,
  setShowReport,
  salesPerMonth,
  clicksPerMonth,
  clicksData,
  refetchSales,
  fields,
  forceRole,
  titleOverride,
  summaryTitleOverride,
}: ReportTableProps) {
  // Role (admin/affiliate)
  const { data } = useQuery(QUERY_ME, { skip: !!forceRole });
  const me: Partial<Affiliate> = data?.me || {};
  const effectiveRole =
    (forceRole ?? (me.role as Affiliate["role"])) || "affiliate";
  const isAdmin = effectiveRole === "admin";

  // Compute which fields to render
  const defaultAdmin: FieldKey[] = [
    "purchaseDate",
    "item",
    "wooProductId",
    "price",
    "orderId",
    "status",
    "transferId",
    "refId",
    "commission",
    "enrolled",
    "actionOrStatus",
  ];
  const defaultAffiliate: FieldKey[] = [
    "purchaseDate",
    "item",
    "wooProductId",
    "price",
    "orderId",
    "status",
    "transferId",
    "refId",
    "commission",
    // "actionOrStatus",
  ];

  const resolvedFields: FieldConfig[] = useMemo(() => {
    const normalize = (
      arr: FieldKey[] | FieldConfig[] | undefined
    ): FieldConfig[] => {
      if (!arr) return [];
      if (typeof arr[0] === "string")
        return (arr as FieldKey[]).map((k) => ({ key: k }));
      return arr as FieldConfig[];
    };

    let list: FieldConfig[];
    if (Array.isArray(fields)) {
      list = normalize(fields as any);
    } else if (fields && typeof fields === "object") {
      const roleList = isAdmin
        ? (fields as any).admin
        : (fields as any).affiliate;
      list = normalize(roleList);
    } else {
      list = normalize(isAdmin ? defaultAdmin : defaultAffiliate);
    }

    const seen = new Set<FieldKey>();
    const dedup = list.filter((f) => {
      if (f.visible === false) return false;
      if (seen.has(f.key)) return false;
      seen.add(f.key);
      return true;
    });

    return dedup.filter((f) =>
      isAdmin ? true : f.key !== "enrolled" && f.key !== "actionOrStatus"
    );
  }, [fields, isAdmin]);

  // Hooks reused from original component
  const [refIdsArr, setRefIdsArr] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const stripeReadyArr = useFetchStripeStatusByRefId(refIdsArr);
  const addedSales = useAddMonthSales(monthSales);
  const { addedCommissions, calculateCommissionsByStatus } =
    useAddMonthCommissions(monthSales);

  const { processingId, paySale, error } = useCommissionTransfer({
    currentMonth,
    onAfterSuccess: async () => {
      if (refetchSales) await refetchSales();
    },
  });

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
    pdf.addImage(
      imgData,
      "JPEG",
      0,
      0,
      canvas.width * ratio,
      canvas.height * ratio
    );
    pdf.save("report.pdf");
  }

  // Column labels (defaults mirror your original text)
  const labelFor = (key: FieldKey): string => {
    switch (key) {
      case "purchaseDate":
        return "Purchase date";
      case "item":
        return "Item";
      case "wooProductId":
        return "Woo Product ID";
      case "price":
        return "Order subtotal (pre-tax)";
      case "orderId":
        return "Order Id";
      case "status":
        return "Commission Status";
      case "transferId":
        return "Transfer ID";
      case "refId":
        return "Affiliate ref Id";
      case "commission":
        return "Commission Earned";
      case "enrolled":
        return "Stripe Connection";
      case "actionOrStatus":
        return isAdmin ? "Action" : "Status";
    }
  };

  // Helpers for Action/Status cell
  const isReady = (sale: any) => stripeReadyArr.includes(sale.refId);
  const isPaying = (sale: any) => processingId === sale.id;
  const canPay = (sale: any) =>
    normalizeCommissionStatus(sale?.commissionStatus) === "unpaid" &&
    (sale?.refundStatus ?? "none") === "none" &&
    Number(sale?.commissionEarned) > 0 &&
    isReady(sale);

  // Cell renderers
  const renderCell = (key: FieldKey, sale: any) => {
    switch (key) {
      case "purchaseDate":
        return new Date(sale.createdAt).toLocaleDateString("en-US", {
          timeZone: "America/New_York",
        });

      case "item":
        return sale.product;

      case "wooProductId":
        return sale.items?.[0]?.wooProductId ?? "—";

      case "price": {
        const subtotal = Number(sale?.subtotal ?? 0);
        const discount = Number(sale?.discount ?? 0);
        const orderSubtotal = Math.max(0, subtotal - discount);
        // fallback if subtotal missing
        const legacy = Number(sale?.amount ?? 0);
        const value = orderSubtotal || legacy;
        return `$${value.toFixed(2)}`;
      }

      case "orderId":
        return sale.orderId;

      case "status":
        return <StatusChips sale={sale} />;

      case "transferId": {
        const id: string | undefined = sale?.transferId;
        if (!id) return "—";
        const expanded = !!expandedIds[sale.id];
        const short = id.length > 10 ? id.slice(0, 10) + "…" : id;
        return (
          <span
            title={id}
            onClick={() =>
              setExpandedIds((m) => ({ ...m, [sale.id]: !m[sale.id] }))
            }
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              cursor: "pointer",
            }}
          >
            {expanded ? id : short}
          </span>
        );
      }

      case "refId":
        return sale.refId;

      case "commission":
        return `$${Number(sale.commissionEarned ?? 0).toFixed(2)}`;

      case "enrolled": {
        const ready = isReady(sale);
        return (
          <span
            className={`pill ${ready ? "pill--succeeded" : "pill--pending"}`}
            title={
              ready
                ? "Affiliate has a verified Stripe connected account and can receive transfers."
                : "Affiliate id not ready to receive transfers."
            }
          >
            {ready ? "connected" : "Not connected"}
          </span>
        );
      }

      case "actionOrStatus": {
        if (isAdmin) {
          // ADMIN: show Refund/Pay controls + status chips
          return (
            <div style={{ display: "grid", gap: 6 }}>
              <RowActions
                sale={sale}
                refetch={refetchSales}
                onPay={() => paySale(sale)}
                isPaying={isPaying(sale)}
                canPay={canPay(sale)}
                isReady={isReady(sale)}
              />
            </div>
          );
        }
      }
    }
  };

  return (
    <div className="print ">
      {error && (
        <div className="alert error no-print" style={{ margin: "8px 0" }}>
          {error}
        </div>
      )}

      <div id="pdf-content" style={{ padding: "2%", borderRadius: "10px" }}>
        <h3 style={{ color: "black" }}>
          {titleOverride ?? `Detailed Report for ${currentMonth}`}
        </h3>
        <div className="pdf-print-line">
          <PiFilePdfThin className="pifile" onClick={() => saveToPDF()} />
          <PiPrinterThin className="piprint" onClick={() => window.print()} />
          <IoMdClose className="ioclose" onClick={() => setShowReport(null)} />
        </div>
        <div className="table-table">
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {resolvedFields.map((f) => (
                  <th key={f.key} className="cell-style-top">
                    {f.label ?? labelFor(f.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthSales?.map((sale: any, index: number) => (
                <tr key={index}>
                  {resolvedFields.map((f) => (
                    <td
                      key={f.key}
                      className="cell-style"
                      data-label={f.label ?? labelFor(f.key)}
                    >
                      {renderCell(f.key, sale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <br />
        <br />
        <h3 style={{ color: "black" }}>
          {summaryTitleOverride ?? " Report summary"}
        </h3>
        <div className="table-table">
          <TotalBar
            addedSales={addedSales()}
            addedCommissions={addedCommissions()}
            calculateCommissionsByStatus={calculateCommissionsByStatus()}
            currentMonth={currentMonth}
            salesPerMonth={salesPerMonth}
            clicksPerMonth={clicksPerMonth}
            monthSales={monthSales}
            findClicks={findClicks()}
            me={{ ...(me as any), role: effectiveRole } as Affiliate}
          />
          <br />
        </div>
      </div>
    </div>
  );
}
