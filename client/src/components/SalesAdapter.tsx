// import React, { useEffect, useMemo, useState } from "react";
// import { useQuery } from "@apollo/client";
// import ReusableTable from "./ReusableTable";
// import type { Affiliate, AffiliateSale } from "../types";
// import { QUERY_ME } from "../utils/queries";
// import useFetchStripeStatusByRefId from "../hooks/useFetchStripeStatusByRefId";
// import useCommissionTransfer from "../hooks/useCommissionTransfer";

// const money = (n: number | null | undefined) =>
//   new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

// const dateStr = (iso?: string | number | Date) =>
//   iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York" }) : "—";

// export type SalesTableProps = {
//   sales: AffiliateSale[];
//   currentMonth: string; // e.g. "September 2025"
//   refetchSales?: () => Promise<any>;
//   title?: React.ReactNode;
//   subtitle?: React.ReactNode;
// };

// export default function SalesTable({ sales, currentMonth, refetchSales, title, subtitle }: SalesTableProps) {
//   // Who am I? (admin vs affiliate)
//   const { data: meData } = useQuery(QUERY_ME);
//   const me: Affiliate | null = meData?.me ?? null;
//   const isAdmin = me?.role === "admin";

//   // Stripe readiness per unique refId in this batch
//   const [refIdsArr, setRefIdsArr] = useState<string[]>([]);
//   useEffect(() => {
//     const unique = Array.from(new Set((sales || []).map((s: any) => s?.refId).filter(Boolean)));
//     setRefIdsArr(unique as string[]);
//   }, [sales]);
//   const stripeReadyArr = useFetchStripeStatusByRefId(refIdsArr);
//   const isStripeReady = (refId?: string | null) => (refId ? stripeReadyArr.includes(refId) : false);

//   // Payout hook (admin only); auto-refetch month after success
//   const { processingId, paySale } = useCommissionTransfer({
//     currentMonth,
//     onAfterSuccess: async () => {
//       if (refetchSales) await refetchSales();
//     },
//   });

//   // Columns
//   type Row = AffiliateSale & { _idx: number };
//   const columns: Column<Row>[] = useMemo(() => [
//     { key: "createdAt", header: "Purchase Date", width: "130px", render: (s) => dateStr((s as any).createdAt) },
//     { key: "product", header: "Item", render: (s) => (s as any).product ?? "—" },
//     { key: "wooProductId", header: "Woo ID", width: "110px", render: (s) => (s as any).items?.[0]?.wooProductId ?? "—", className: "text-monospace" },
//     { key: "unitPrice", header: "Price", width: "110px", render: (s) => money(Number((s as any).items?.[0]?.unitPrice ?? 0)), align: "right" },
//     { key: "orderId", header: "Order ID", width: "130px", render: (s) => (s as any).orderId ?? "—", className: "text-monospace" },
//     { key: "refId", header: "refId", width: "120px", render: (s) => (s as any).refId ?? "—", className: "text-monospace" },
//     { key: "commissionEarned", header: "Commission", width: "120px", render: (s) => money(Number((s as any).commissionEarned ?? 0)), align: "right" },
//     ...(isAdmin
//       ? [{
//           key: "ready", header: "Ready", width: "110px", render: (s) => {
//             const ready = isStripeReady((s as any).refId);
//             return <span className={`badge ${ready ? "text-bg-success" : "text-bg-warning"}`}>{ready ? "Ready" : "Not ready"}</span>;
//           },
//         } as Column<Row>] : []),
//     {
//       key: "action",
//       header: isAdmin ? "Action" : "Status",
//       width: "140px",
//       align: "right",
//       render: (s) => {
//         const status = ((s as any).commissionStatus ?? "unpaid") as "unpaid" | "processing" | "paid";
//         const paying = (s as any).id === processingId;
//         if (!isAdmin) {
//           const pill = status === "paid" ? "text-bg-success" : status === "processing" ? "text-bg-secondary" : "text-bg-warning";
//           return <span className={`badge ${pill}`}>{status}</span>;
//         }
//         const ready = isStripeReady((s as any).refId);
//         const disabled = paying || status !== "unpaid" || !ready;
//         const label = paying ? "Paying…" : status === "paid" ? "Paid" : status === "processing" ? "Processing…" : "Pay";
//         return (
//           <button
//             type="button"
//             className={`btn btn-sm ${disabled ? "btn-outline-secondary" : "btn-dark"}`}
//             disabled={disabled}
//             onClick={(e) => { e.stopPropagation(); paySale(s as any); }}
//           >
//             {label}
//           </button>
//         );
//       },
//     },
//   ], [isAdmin, processingId, stripeReadyArr]);

//   // Rows
//   const rows = useMemo(() => (sales || []).map((s, _idx) => Object.assign({ _idx }, s)), [sales]);

//   // Expand panel
//   const renderExpand = (s: Row) => {
//     const items = (s as any).items ?? [];
//     return (
//       <div className="row g-3">
//         <div className="col-12 col-lg-6">
//           <h6 className="mb-2">Line Items</h6>
//           <ul className="list-group list-group-flush small">
//             {items.length === 0 && <li className="list-group-item">No items</li>}
//             {items.map((it: any, i: number) => (
//               <li className="list-group-item d-flex justify-content-between" key={i}>
//                 <span>{it.name ?? "Item"} × {it.qty ?? 1}</span>
//                 <span className="text-monospace">{money(Number(it.lineTotal ?? it.unitPrice ?? 0))}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="col-12 col-lg-6">
//           <h6 className="mb-2">Raw JSON</h6>
//           <pre className="bg-dark text-light p-2 rounded small mb-0" style={{ maxHeight: 260, overflow: "auto" }}>
//             {JSON.stringify(s, null, 2)}
//           </pre>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <ReusableTable
//       title={title ?? `Sales — ${currentMonth}`}
//       subtitle={subtitle}
//       columns={columns}
//       rows={rows as any}
//       getRowId={(s) => (s as any).id || `${(s as any).orderId || "row"}-${(s as any)._idx}`}
//       renderExpand={renderExpand}
//       stickyHeader
//       dense
//     />
//   );
// }
