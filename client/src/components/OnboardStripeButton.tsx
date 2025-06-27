import { useMutation } from "@apollo/client";
import { CREATE_STRIPE_ACCOUNT } from "../utils/mutations";

const OnboardStripeButton = ({ affiliateId }: { affiliateId: string }) => {
  const [createStripeAccount] = useMutation(CREATE_STRIPE_ACCOUNT);

  const handleClick = async () => {
    const { data } = await createStripeAccount({ variables: { affiliateId } });
    if (data?.createAffiliateStripeAccount) {
      window.location.href = data.createAffiliateStripeAccount;
    }
  };

  return <button onClick={handleClick}>Connect Stripe for Payouts</button>;
};
export default OnboardStripeButton;
