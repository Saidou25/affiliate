import { useMutation } from "@apollo/client";
import { CREATE_AFFILIATE_STRIPE_ACCOUNT } from "../utils/mutations";

interface StripeStatus {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

interface Props {
  affiliateId: string;
  stripeStatusData: StripeStatus | null;
  loading: boolean;
}

export default function StripeStatusCard({
  affiliateId,
  stripeStatusData,
  loading,
}: Props) {
  const [createStripeAccount] = useMutation(CREATE_AFFILIATE_STRIPE_ACCOUNT);

  const handleResumeOnboarding = async () => {
    try {
      const { data } = await createStripeAccount({
        variables: { affiliateId },
      });

      const url = data?.createAffiliateStripeAccount?.url;
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      console.error("⚠️ Failed to resume onboarding:", err.message);
    }
  };

  if (loading) return <p>Loading Stripe status...</p>;
  if (!stripeStatusData) return null;

  return (
    <div
      style={{
        backgroundColor: "#0b0b0b",
        // border: "1px solid #3511c7",
        padding: "1rem",
        borderRadius: "8px",
        color: "white",
        marginTop: "1rem",
      }}
    >
      {!stripeStatusData.details_submitted ? (
        <>
          <p>You haven’t completed onboarding yet.</p>
          <button
            onClick={handleResumeOnboarding}
            style={{
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Finish Onboarding
          </button>
        </>
      ) : stripeStatusData.payouts_enabled ? (
        <p>✅ Stripe connected and ready for payouts.</p>
      ) : (
        <p>⚠️ Onboarding submitted, but payouts are not yet enabled.</p>
      )}
    </div>
  );
}
