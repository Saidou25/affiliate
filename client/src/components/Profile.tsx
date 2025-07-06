import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import OnboardStripeButton from "./OnboardStripeButton";

export default function Profile() {
  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  return (
    <>
      <h2>My Profile</h2>
      <div
        className="profile-container"
        style={{
          backgroundColor: "black",
          padding: "2%",
          borderRadius: "10px",
        }}
      >
        {me.name && (
          <>
            <strong>Name - </strong>
            {me.name}
            <br />
          </>
        )}
        {me.email && (
          <>
            <strong>Email - </strong>
            {me.email}
            <br />
          </>
        )}
        {me.refId && (
          <>
            <strong>My reference id - </strong>
            {me.refId} <br />
          </>
        )}
        {me.commissionRate && (
          <>
            <strong>Commission rate - </strong>
            {me.commissionRate * 100}%<br />
          </>
        )}
        <br />
        {!me.stripeAccountId ? (
          <OnboardStripeButton />
        ) : (
          <p>✅ Stripe connected</p>
        )}
      </div>
    </>
  );
}
