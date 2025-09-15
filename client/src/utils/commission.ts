export type CommissionStatus =
  | "unpaid"
  | "processing"
  | "paid"
  | "reversed"
  | "refunded"; // legacy

export function normalizeCommissionStatus(
  s?: string | null
): "unpaid" | "processing" | "paid" | "reversed" {
  if (!s) return "unpaid";
  const v = String(s).toLowerCase();
  if (v === "unpaid" || v === "processing" || v === "paid") return v;
  // Treat legacy "refunded" as "reversed" (commission clawed back)
  if (v === "refunded" || v === "reversed") return "reversed";
  return "unpaid";
}

export function commissionLabel(s?: string | null): string {
  switch (normalizeCommissionStatus(s)) {
    case "unpaid": return "Unpaid";
    case "processing": return "Processing";
    case "paid": return "Paid";
    case "reversed": return "Reversed";
  }
}

export function commissionColorPillVariant(
  s?: string | null
): "succeeded" | "pending" | "canceled" | "processing" | "unpaid" {
  switch (normalizeCommissionStatus(s)) {
    case "unpaid": return "unpaid";
    case "processing": return "processing";
    case "paid": return "succeeded";
    case "reversed": return "canceled";
  }
}
