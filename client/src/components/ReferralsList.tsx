import { useQuery } from "@apollo/client";
import { GET_REFERRALS } from "../utils/queries";

interface Referral {
  refId: String;
  email: String;
  event: String;
}

export default function ReferralsList() {
  const {
    data: referralsData,
    loading: loadingReferrals,
    error: errorReferrals,
  } = useQuery<{ getReferrals: Referral[] }>(GET_REFERRALS);

  return (
    <div>
      {" "}
      <h2>All tracked Referrals</h2>
      <strong style={{ color: "white" }}></strong>
      {loadingReferrals && <p>Loading referrals...</p>}
      {errorReferrals && (
        <p>Error fetching referrals: {errorReferrals.message}</p>
      )}
      {referralsData &&
        referralsData.getReferrals.map((referral: any) => (
          <div key={referral.refId}>
            <strong>{referral.event}</strong> - {referral.name} -{" "}
            {referral.email} -{referral.refId}
            <br />
          </div>
        ))}
    </div>
  );
}
