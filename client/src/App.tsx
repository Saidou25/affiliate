import { useMutation, useQuery } from "@apollo/client";
import { useEffect } from "react";
// import { useReferralCode } from "./hooks/useReferralCode";
import { GET_AFFILIATES, GET_REFERRALS } from "./utils/queries";
import { DELETE_AFFILIATE, LOG_CLICK } from "./utils/mutations";

import Form from "./components/Form";

import "./index.css";
import Products from "./components/Products";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
}

interface Referral {
  refId: String;
  email: String;
  event: String;
}

function App() {
  // const [refLink, setRefLink] = useState("");

  // const referralCode = useReferralCode();

  const { data, loading, error } = useQuery<{ getAffiliates: Affiliate[] }>(
    GET_AFFILIATES
  );

  const [deleteAffiliate] = useMutation(DELETE_AFFILIATE, {
    update(cache, { data: { deleteAffiliate } }) {
      try {
        const existingData = cache.readQuery<{ getAffiliates: Affiliate[] }>({
          query: GET_AFFILIATES,
        });

        if (existingData && deleteAffiliate) {
          cache.writeQuery({
            query: GET_AFFILIATES,
            data: {
              getAffiliates: existingData.getAffiliates.filter(
                (a) => a.id !== deleteAffiliate.id
              ),
            },
          });
        }
      } catch (error) {
        console.error("Cache update error:", (error as Error).message);
      }
    },
  });

  const removeAffiliate = async (affiliateId: string) => {
    console.log(affiliateId)
    try {
      const { data } = await deleteAffiliate({
        variables: {
          id: affiliateId.toString(),
        },
      });
      if (data) {
        console.log("success deleting affiliate", data);
      }
    } catch (error) {
      console.error((error as Error).message);
    }
  };

  const {
    data: referralsData,
    loading: loadingReferrals,
    error: errorReferrals,
  } = useQuery<{ getReferrals: Referral[] }>(GET_REFERRALS);

  // const dynamicReferralCode = nanoid(8);
  // const link = `https://princetongreen.org/a-free-55-day-journey-to-unleash-your-power-from-within/?ref=${referralCode}`;

  // const deleteAffiliate = (refId: string) => {
  //   // console.log(data);
  //   console.log(referralCode);
  //   console.log(refId);
  //   if (refId === referralCode) {
  //     // const affiliate = data.getAffiliates.filter(
  //     //   (d: Affiliate) => d.refId === referralCode
  //     // );
  //     // console.log(affiliate[0].name);
  //     console.log("yes: ", refId);
  //     setRefLink(
  //       `https://princetongreen.org/a-free-55-day-journey-to-unleash-your-power-from-within/?ref=${referralCode}`
  //     );
  //   } else {
  //     console.log("not the one: ", referralCode);
  //   }
  // };

  const [logClick] = useMutation(LOG_CLICK);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const refId = params.get("ref");

  if (refId) {
    logClick({ variables: { refId } });
  }
}, []);


  return (
    <div>
      <Form />
      <h2>All Affiliates</h2>
      <strong style={{ color: "white" }}></strong>
      {loading && <p>Loading users...</p>}
      {error && <p>Error fetching users: {error.message}</p>}
      {data &&
        data.getAffiliates.map((affiliate: any) => (
          <div key={affiliate.id}>
            <strong>
              {affiliate.name}- {affiliate.id}
            </strong>{" "}
            - {affiliate.email} - {affiliate.refId} - {affiliate.totalClicks ? affiliate.totalClicks : null} -{" "}
            {affiliate.totalCommissions ? affiliate.totalCommissions : null}
            <button onClick={() => removeAffiliate(affiliate.id)}>
              remove
            </button>
            <br />
            {/* {affiliate.refId === referralCode && <>{refLink}</>} */}
          </div>
        ))}
      <h2>All tracked Referrals</h2>
      <strong style={{ color: "white" }}></strong>
      {loadingReferrals && <p>Loading referrals...</p>}
      {errorReferrals && (
        <p>Error fetching referrals: {errorReferrals.message}</p>
      )}
      {referralsData &&
        referralsData.getReferrals.map((referral: any) => (
          <div key={referral.refId}>
            <strong>{referral.event}</strong> - {referral.name} - {referral.email} -
            {referral.refId}
            {/* <button onClick={() => deleteAffiliate(referral.refId)}>
              remove
            </button> */}
            <br />
            {/* {referral.refId === referralCode && <>{refLink}</>} */}
          </div>
        ))}
        <Products />
    </div>
  );
}

export default App;
