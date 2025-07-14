// import { useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
// import { CREATE_NOTIFICATION } from "../utils/mutations";
// import { QUERY_ME } from "../utils/queries";
// import Spinner from "./Spinner";
// import { useEffect, useRef } from "react";

export default function StripeReturn() {
  // const [createNotification] = useMutation(CREATE_NOTIFICATION);
  // const { data, loading } = useQuery(QUERY_ME);
  // const me = data?.me || {};
  // const hasCreated = useRef(false);

  // useEffect(() => {
  //   const newNotification = async () => {
  //     try {
  //       await createNotification({
  //         variables: {
  //           refId: me.refId,
  //           title: "Onboarding completed",
  //           text: "Congrats! Your Stripe account is ready to receive commissions.",
  //           read: false,
  //         },
  //       });
  //       console.log("✅ Notification created");
  //       hasCreated.current = true;
  //     } catch (error) {
  //       console.log("❌ Failed to create finalized notification:", error);
  //     }
  //   };

  //   if (me.refId && !hasCreated.current) {
  //     newNotification();
  //   }
  // }, [me.refId]);

  // if (loading) {
  //   return <Spinner />;
  // }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎉 Stripe onboarding complete!</h2>
      <p>Your Stripe account is now connected and ready to receive payouts.</p>
      <Link to="/affiliate/products">Go to Dashboard</Link>
    </div>
  );
}
