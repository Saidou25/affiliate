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
};

export default function useStripePayout(opts?: UseStripePayoutOpts) {
  const {
    currentMonth,
    onAfterSuccess,
    method = "bank",
    amountOverride,
  } = opts || {};

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [getAffiliateByRefId] = useLazyQuery(GET_AFFILIATE_BY_REFID, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });
  const [checkStripeStatus] = useLazyQuery(CHECK_STRIPE_STATUS, {
    errorPolicy: "all",
    fetchPolicy: "network-only",
  });
  const [recordAffiliatePayment] = useMutation(RECORD_AFFILIATE_PAYMENT);

  const checkReadyByRefId = useCallback(
    async (
      refId: string
    ): Promise<{ ready: boolean; affiliateId?: string }> => {
      setError(null);

      const { data: aData } = await getAffiliateByRefId({
        variables: { refId },
      });
      const affiliateId = aData?.getAffiliateByRefId?.id as string | undefined;
      if (!affiliateId) return { ready: false };

      const { data: sData } = await checkStripeStatus({
        variables: { affiliateId },
      });
      const ready =
        !!sData?.checkStripeStatus?.charges_enabled &&
        !!sData?.checkStripeStatus?.payouts_enabled;

      return { ready, affiliateId };
    },
    [getAffiliateByRefId, checkStripeStatus]
  );

  const paySale = useCallback(
    async (sale: AffiliateSale): Promise<boolean> => {
      setError(null);

      if (!sale.id) {
        setError("Sale is missing an id");
        return false;
      }
      if (!sale.refId) {
        setError("Sale is missing a refId");
        return false;
      }

      setProcessingId(sale.id);

      try {
        // 1) readiness gate
        const { ready } = await checkReadyByRefId(sale.refId);
        if (!ready) throw new Error("Affiliate not ready for payouts.");

        // 2) compute the amount your resolver expects
        const resolvedAmount =
          amountOverride?.(sale) ??
          (typeof (sale as any).total === "number"
            ? (sale as any).total
            : Number(sale.amount ?? 0));

        if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
          throw new Error("Invalid sale amount.");
        }

        // 3) call your existing mutation
        const { data } = await recordAffiliatePayment({
          variables: {
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
          },
        });

        if (data && onAfterSuccess) await onAfterSuccess();
        return Boolean(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to process payout.");
        return false;
      } finally {
        setProcessingId(null);
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
