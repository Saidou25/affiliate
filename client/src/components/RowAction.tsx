// src/components/RowActions.tsx
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { REFUND_AFFILIATE_SALE } from "../utils/mutations";
import type { AffiliateSale } from "../types";
import "./RowAction.css"; // keep your css

type RowActionsProps = {
  sale: AffiliateSale;
  refetch?: () => void;
  onPay?: () => Promise<any> | void; // allow async
  isPaying: boolean;
  canPay: boolean;
  isReady: boolean;
};

type ActionMode = "" | "pay" | "refund";

export default function RowActions({
  sale,
  refetch,
  onPay,
  isPaying,
  canPay,
  isReady,
}: RowActionsProps) {
  const [mode, setMode] = useState<ActionMode>("");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(""); // blank => refund remaining
  const [reason, setReason] = useState<string>("");

  const [refundSale, { loading: refunding, error }] = useMutation(
    REFUND_AFFILIATE_SALE
  );

  const canRefund = (sale.refundStatus ?? "none") !== "full";
  const disabledAll = isPaying || refunding;

  const handleSelect = (val: ActionMode) => {
    if (val === "pay" && canPay && !disabledAll) {
      setMode("pay");
      setOpen(true);
    } else if (val === "refund" && canRefund && !disabledAll) {
      setMode("refund");
      setOpen(true);
    }
  };

  const closeModal = () => {
    setOpen(false);
    // allow re-selecting the same option later
    setTimeout(() => setMode(""), 0);
  };

  // Submit handlers (form-based)
  const onSubmitPay: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!canPay || disabledAll) return;
    await onPay?.(); // trigger your payout mutation
    closeModal();
  };

  const onSubmitRefund: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    await refundSale({
      variables: {
        input: {
          saleId: sale.id,
          amount: amount === "" ? undefined : Number(amount),
          reason: reason || undefined,
        },
      },
    });
    closeModal();
    refetch?.();
  };

  const payLabel = canPay
    ? "Create transfer"
    : !isReady
    ? "Transfer (Stripe not ready)"
    : "Transfer (N/A)";

  const refundLabel = canRefund ? "Refund…" : "Refund (fully refunded)";

  // Escape closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && open && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="row-actions">
      <select
        className="action-select"
        value=""
        onChange={(e) => handleSelect(e.currentTarget.value as ActionMode)}
        disabled={disabledAll}
        title={
          disabledAll ? "Action disabled while processing" : "Choose an action"
        }
      >
        <option value="">Select action…</option>
        <option value="pay" disabled={!canPay}>
          {payLabel}
        </option>
        <option value="refund" disabled={!canRefund}>
          {refundLabel}
        </option>
      </select>

      {/* Modal overlay */}
      <div
        className={`modal ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="card" role="document">
          {mode === "pay" && (
            <form onSubmit={onSubmitPay}>
              <h4>Confirm transfer</h4>
              <p>
                This will initiate the commission transfer to the affiliate’s
                connected Stripe account. Continue?
              </p>
              <div className="actions">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={!canPay || isPaying}>
                  {isPaying ? "Transfering..." : "Confirm transfer"}
                </button>
              </div>
            </form>
          )}

          {mode === "refund" && (
            <form onSubmit={onSubmitRefund}>
              <h4>Refund this charge</h4>
              <p>Leave amount blank to refund the remaining balance.</p>

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount (e.g., 5.00)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <input
                type="text"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              {error && (
                <div className="alert error" style={{ marginTop: 8 }}>
                  {String(error.message || error)}
                </div>
              )}

              <div className="actions">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" disabled={refunding}>
                  {refunding ? "Refunding…" : "Confirm refund"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
