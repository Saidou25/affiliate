import { useState, useCallback } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import { CHECK_STRIPE_STATUS, GET_AFFILIATE_BY_REFID } from "../utils/queries";
import { RECORD_AFFILIATE_PAYMENT } from "../utils/mutations";
import type { AffiliateSale } from "../types";

type UseStripePayoutOpts = {
  currentMonth?: string;
  onAfterSuccess?: () => Promise<any> | void;
  method?: "bank" | "paypal" | "crypto" | string;
  amountOverride?: (sale: AffiliateSale) => number | undefined;
  debug?: boolean; // <-- NEW
};

export default function useStripePayout(opts?: UseStripePayoutOpts) {
  const {
    currentMonth,
    onAfterSuccess,
    method = "bank",
    amountOverride,
    debug = process.env.NODE_ENV !== "production",
  } = opts || {};

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dbg = (...args: any[]) => {
    if (debug) console.log("[useStripePayout]", ...args);
  };
  const group = (label: string) => debug && console.groupCollapsed(label);
  const groupEnd = () => debug && console.groupEnd();

  const [getAffiliateByRefId] = useLazyQuery(GET_AFFILIATE_BY_REFID, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
    onCompleted: (d) => dbg("GET_AFFILIATE_BY_REFID ✓", d),
    onError: (e) => dbg("GET_AFFILIATE_BY_REFID ✗", e?.message || e),
  });

  const [checkStripeStatus] = useLazyQuery(CHECK_STRIPE_STATUS, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
    onCompleted: (d) => dbg("CHECK_STRIPE_STATUS ✓", d),
    onError: (e) => dbg("CHECK_STRIPE_STATUS ✗", e?.message || e),
  });

  const [recordAffiliatePayment] = useMutation(RECORD_AFFILIATE_PAYMENT, {
    onCompleted: (d) => dbg("RECORD_AFFILIATE_PAYMENT ✓", d),
    onError: (e) => dbg("RECORD_AFFILIATE_PAYMENT ✗", e?.message || e),
  });

  const checkReadyByRefId = useCallback(
    async (
      refId: string
    ): Promise<{ ready: boolean; affiliateId?: string }> => {
      setError(null);
      group(`checkReadyByRefId(refId=${refId})`);
      try {
        console.time("↪ getAffiliateByRefId");
        const { data: aData } = await getAffiliateByRefId({
          variables: { refId },
        });
        console.timeEnd("↪ getAffiliateByRefId");

        const affiliateId = aData?.getAffiliateByRefId?.id as
          | string
          | undefined;
        dbg("affiliateId:", affiliateId);

        if (!affiliateId) {
          dbg("not ready: no affiliateId for refId", refId);
          return { ready: false };
        }

        console.time("↪ checkStripeStatus");
        const { data: sData } = await checkStripeStatus({
          variables: { affiliateId },
        });
        console.timeEnd("↪ checkStripeStatus");
        if (sData) {
          console.log("data: ", sData);
        }

        const s = sData?.checkStripeStatus;
        if (s) {
          dbg(
            "stripe status:",
            s,
            "→ ready:",
            !!s.charges_enabled && !!s.payouts_enabled
          );
          // extra visibility
          if (s.lastTransferId) {
            dbg("last transfer:", {
              id: s.lastTransferId,
              amount: s.lastTransferAmount,
              currency: s.lastTransferCurrency,
              createdAt: s.lastTransferCreatedAt,
              reversed: s.lastTransferReversed,
            });
          }
        }

        const ready =
          !!sData?.checkStripeStatus?.charges_enabled &&
          !!sData?.checkStripeStatus?.payouts_enabled;

        dbg("stripe status:", sData?.checkStripeStatus, "→ ready:", ready);
        return { ready, affiliateId };
      } catch (e: any) {
        dbg("checkReadyByRefId error:", e?.message || e);
        setError(e?.message ?? "Failed to check Stripe status.");
        return { ready: false };
      } finally {
        groupEnd();
      }
    },
    [getAffiliateByRefId, checkStripeStatus]
  );

  const paySale = useCallback(
    async (sale: AffiliateSale): Promise<boolean> => {
      setError(null);

      group(`paySale(saleId=${sale?.id || "?"}, refId=${sale?.refId || "?"})`);
      dbg("sale snapshot:", {
        id: sale?.id,
        refId: sale?.refId,
        total: (sale as any)?.total,
        amount_legacy: sale?.amount,
        commissionEarned: sale?.commissionEarned,
        commissionStatus: sale?.commissionStatus,
      });

      if (!sale?.id) {
        const msg = "Sale is missing an id";
        dbg("guard:", msg);
        setError(msg);
        groupEnd();
        return false;
      }
      if (!sale?.refId) {
        const msg = "Sale is missing a refId";
        dbg("guard:", msg);
        setError(msg);
        groupEnd();
        return false;
      }

      setProcessingId(sale.id);

      try {
        console.time("① readiness");
        const { ready } = await checkReadyByRefId(sale.refId);
        console.timeEnd("① readiness");
        if (!ready) {
          throw new Error("Affiliate not ready for payouts.");
        }

        console.time("② compute amount");
        const resolvedAmount =
          amountOverride?.(sale) ??
          (typeof (sale as any).total === "number"
            ? (sale as any).total
            : Number(sale.amount ?? 0));
        console.timeEnd("② compute amount");
        dbg("resolvedAmount:", resolvedAmount);

        if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
          throw new Error("Invalid sale amount.");
        }

        const variables = {
          input: {
            refId: sale.refId,
            saleIds: [sale.id],
            saleAmount: resolvedAmount,
            method,
            transactionId: `BANK-TRX-${Date.now()}-${Math.floor(
              Math.random() * 1e6
            )}`,
            notes: `${currentMonth ?? ""} payout for ${sale.refId}`.trim(),
          },
        };
        dbg("mutation variables:", variables);

        console.time("③ recordAffiliatePayment");
        const { data } = await recordAffiliatePayment({ variables });
        console.timeEnd("③ recordAffiliatePayment");

        const ok = Boolean(data?.recordAffiliatePayment?.id);
        dbg("recordAffiliatePayment result ok:", ok);

        if (ok && onAfterSuccess) {
          console.time("④ onAfterSuccess");
          await onAfterSuccess();
          console.timeEnd("④ onAfterSuccess");
        }

        return ok;
      } catch (e: any) {
        const msg = e?.message ?? "Failed to process payout.";
        dbg("paySale error:", msg, e);
        setError(msg);
        return false;
      } finally {
        setProcessingId(null);
        groupEnd();
      }
    },
    [
      amountOverride,
      checkReadyByRefId,
      recordAffiliatePayment,
      currentMonth,
      method,
      onAfterSuccess,
    ]
  );

  return {
    processingId,
    error,
    checkReadyByRefId,
    paySale,
  };
}
