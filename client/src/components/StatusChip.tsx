// StatusChip.tsx
import type { AffiliateSale } from "../types";
import "./StripeChargesListTable.css";
import {
  normalizeCommissionStatus,
  commissionLabel,
  commissionColorPillVariant,
} from "../utils/commission";

// 📝 EXPLAINATIONS shown on hover
const COMMISSION_EXPLAINATIONS = {
  unpaid: "Earned but not transferred yet.",
  processing: "Transfer initiated; awaiting Stripe completion.",
  paid: "Commission transferred to the affiliate’s Stripe account.",
  reversed:
    "Buyer refunded; previously paid commission was clawed back (pro-rata if partial).",
} as const;

const REFUND_EXPLAINATIONS = {
  partial: "Buyer received a partial refund for this order.",
  full: "Buyer was fully refunded for this order.",
} as const;

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
      title={COMMISSION_EXPLAINATIONS[normalized]}
    />
  );

  // Refund state (none | partial | full)
  const refundStatus = sale.refundStatus ?? "none";
  const refundPill =
    refundStatus !== "none" ? (
      refundStatus === "full" ? (
        <Pill
          variant="refunded"
          text="Refunded"
          title={REFUND_EXPLAINATIONS.full}
        />
      ) : (
        <Pill
          variant="partially-refunded"
          text="Partially refunded"
          title={REFUND_EXPLAINATIONS.partial}
        />
      )
    ) : null;

  return (
    <div className="chips">
      {commissionPill} {refundPill}
    </div>
  );
}
