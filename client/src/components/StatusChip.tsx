// StatusChip.tsx
import type { AffiliateSale } from "../types";
import "./StripeChargesListTable.css";
import {
  normalizeCommissionStatus,
  commissionLabel,
  commissionColorPillVariant,
} from "../utils/commission";

type PillVariant =
  | "succeeded"
  | "pending"
  | "refunded"
  | "partially-refunded"
  | "canceled"
  | "captured"
  | "processing"
  | "unpaid";

function Pill({
  text,
  variant,
  title,
}: {
  text: string;
  variant: PillVariant;
  title?: string;
}) {
  return (
    <span className={`pill pill--${variant}`} title={title || ""}>
      {text}
    </span>
  );
}

export function StatusChips({ sale }: { sale: AffiliateSale }) {
  // Commission / transfer state (normalized)
  const normalized = normalizeCommissionStatus(sale.commissionStatus);
  const commissionPill = (
    <Pill
      variant={commissionColorPillVariant(normalized)}
      text={commissionLabel(normalized)}
    />
  );

  // Refund state
  const refundPill =
    sale.refundStatus && sale.refundStatus !== "none"
      ? sale.refundStatus === "full"
        ? <Pill variant="refunded" text="Refunded" />
        : <Pill variant="partially-refunded" text="Partially refunded" />
      : null;

  return (
    <div className="chips">
      {commissionPill} {refundPill}
    </div>
  );
}
