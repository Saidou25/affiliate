export const fetchStripeStatusByRefId = async (
  refId: string,
  getAffiliateByRefId: any,
  checkStripeStatus: any
): Promise<boolean> => {
  const affiliateResult = await getAffiliateByRefId({ variables: { refId } });
  const affiliateId = affiliateResult?.data?.getAffiliateByRefId?.id;

  if (!affiliateId) return false;

  const stripeResult = await checkStripeStatus({
    variables: { affiliateId },
  });
  const stripeStatus = stripeResult?.data?.checkStripeStatus;

  return (
    Boolean(stripeStatus?.charges_enabled) &&
    Boolean(stripeStatus?.payouts_enabled)
  );
};
