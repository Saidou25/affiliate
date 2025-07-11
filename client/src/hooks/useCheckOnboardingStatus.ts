import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { CHECK_STRIPE_STATUS } from "../utils/queries";

type StripeStatus = {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  success: boolean;
  message?: string;
};

const useCheckOnboardingStatus = (affiliateId: string) => {
  const [stripeStatusData, setStripeStatusData] = useState<StripeStatus | null>(
    null
  );

  const [checkStripeStatus, { data, loading, error }] =
    useLazyQuery(CHECK_STRIPE_STATUS);

  useEffect(() => {
    if (affiliateId) {
      checkStripeStatus({ variables: { affiliateId } });
    }
  }, [affiliateId]);

  useEffect(() => {
    if (data?.checkStripeStatus) {
      setStripeStatusData(data.checkStripeStatus);
    }
  }, [data]);

  return { stripeStatusData, loading, error };
};

export default useCheckOnboardingStatus;
