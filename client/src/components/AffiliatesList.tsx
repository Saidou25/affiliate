import { useMutation, useQuery } from "@apollo/client";
import { GET_AFFILIATES } from "../utils/queries";
import { DELETE_AFFILIATE } from "../utils/mutations";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
}

export default function AffiliatesList() {
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

  return (
    <div>
      {" "}
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
    </div>
  );
}
