import { useMutation, useQuery } from "@apollo/client";
import { GET_AFFILIATES, GET_REFERRALS } from "../utils/queries";
import { DELETE_AFFILIATE, LOG_CLICK } from "../utils/mutations";
import { useEffect } from "react";
import Products from "./Products";

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

export default function Dashboard() {
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
    console.log(affiliateId);
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

  const [logClick] = useMutation(LOG_CLICK);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("ref");

    if (refId) {
      logClick({ variables: { refId } });
    }
  }, []);

  useEffect(() => {
    if (data) {
      console.log("all affiliates: ", data);
    } else {
      console.log("no affiliates yet...");
    }
  }, [data]);
  return (
    <div>
      <h2>All Affiliates</h2>
      <strong style={{ color: "white" }}></strong>
      {loading && <p>Loading users...</p>}
      {error && <p>Error fetching users: {error.message}</p>}
      {data &&
        data?.getAffiliates?.map((affiliate: any) => (
          <div key={affiliate.id}>
            <strong>
              {affiliate.name}- {affiliate.id}
            </strong>{" "}
            - {affiliate.email} - {affiliate.refId} -{" "}
            {affiliate.totalClicks ? affiliate.totalClicks : null} -{" "}
            {affiliate.totalCommissions ? affiliate.totalCommissions : null}
            <button onClick={() => removeAffiliate(affiliate.id)}>
              remove
            </button>
            <br />
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
            <strong>{referral.event}</strong> - {referral.name} -{" "}
            {referral.email} -{referral.refId}
            <br />
          </div>
        ))}
      <Products />
    </div>
  );
}
