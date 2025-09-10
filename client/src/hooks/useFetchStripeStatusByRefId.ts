import { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { CHECK_STRIPE_STATUS, GET_AFFILIATE_BY_REFID } from "../utils/queries";

export default function useFetchStripeStatusByRefId(refIds: string[]) {
  const [getAffiliateByRefId] = useLazyQuery(GET_AFFILIATE_BY_REFID);
  const [checkStripeStatus] = useLazyQuery(CHECK_STRIPE_STATUS);
  const [stripeReadyArr, setStripeReadyArr] = useState<string[]>([]);

  const checkStatus = async (affiliateId: string, refId: string) => {
    try {
      const stripeResult = await checkStripeStatus({
        variables: { affiliateId },
      });

      if (stripeResult) { console.log("stripeResult: ", stripeResult);}
      
      if (stripeResult?.data?.checkStripeStatus.payouts_enabled === true) {
        setStripeReadyArr((prev) =>
          prev.includes(refId) ? prev : [...prev, refId]
        );

        // const status = stripeResult?.data?.checkStripeStatus;
        // console.log("status for affiliate: ", status);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAffiliates = async (refIdsArr: string[]) => {
    for (let refId of refIdsArr) {
      try {
        const affiliateResult = await getAffiliateByRefId({
          variables: { refId },
        });
        const affiliateId = affiliateResult?.data?.getAffiliateByRefId?.id;
        checkStatus(affiliateId, refId);
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (refIds) {
      getAffiliates(refIds);
    }
  }, [refIds]);

  return stripeReadyArr;
}
