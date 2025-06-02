// import { DELETE_AFFILIATE } from "../utils/mutations";

import "./DetailedReport.css";

type Props = {
  data: any;
  loading: boolean;
  errorText: string | undefined;
};

export default function AffiliatesList({ data, loading, errorText }: Props) {
  
  // const yearlySales = (allSalesData?.getAllAffiliateSales)?.length;

  // const [deleteAffiliate] = useMutation(DELETE_AFFILIATE, {
  //   update(cache, { data: { deleteAffiliate } }) {
  //     try {
  //       const existingData = cache.readQuery<{ getAffiliates: Affiliate[] }>({
  //         query: GET_AFFILIATES,
  //       });

  //       if (existingData && deleteAffiliate) {
  //         cache.writeQuery({
  //           query: GET_AFFILIATES,
  //           data: {
  //             getAffiliates: existingData.getAffiliates.filter(
  //               (a) => a.id !== deleteAffiliate.id
  //             ),
  //           },
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Cache update error:", (error as Error).message);
  //     }
  //   },
  // });

  // const removeAffiliate = async (affiliateId: string) => {
  //   console.log(affiliateId);
  //   try {
  //     const { data } = await deleteAffiliate({
  //       variables: {
  //         id: affiliateId.toString(),
  //       },
  //     });
  //     if (data) {
  //       console.log("success deleting affiliate", data);
  //     }
  //   } catch (error) {
  //     console.error((error as Error).message);
  //   }
  // };

  return (
    <>
      <h2>Affiliates</h2>
    <div className="res">
      <h2>
        {data?.getAffiliates?.length ? (
          <>
            Total sale's force has {data?.getAffiliates?.length - 1} affiliates{" "}
          </>
        ) : null}
      </h2>
      <strong style={{ color: "white" }}></strong>
      {loading && <p>Loading users...</p>}
      {errorText && <p>Error fetching users: {errorText}</p>}
      {data && (
        <div
          style={{
            padding: "2%",
            borderRadius: "10px",
            backgroundColor: "rgb(243, 238, 220)",
          }}
        >
          <table
            id="pdf-content"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr style={{ textAlign: "center" }}>
                <th className="cell-style-top">Email</th>
                <th className="cell-style-top">Affiliate ID</th>
                <th className="cell-style-top">Reference ID</th>
                <th className="cell-style-top">Affiliate since</th>
                <th className="cell-style-top">Total Clicks(yearly)</th>
                <th className="cell-style-top">Total Sales(yearly)</th>
                <th className="cell-style-top">Total Sale's amount(yearly)</th>
                <th className="cell-style-top">Commission Rate</th>
                <th className="cell-style-top">Commissions Earned(yearly)</th>
                {/* <th className="cell-style">Price</th> */}
              </tr>
            </thead>
            <tbody>
              {data?.getAffiliates?.map((affiliate: any) => (
                <tr key={affiliate.id}>
                  {affiliate.role === "affiliate" && (
                    <>
                      <td className="cell-style">{affiliate.email}</td>
                      <td className="cell-style">{affiliate.id}</td>
                      <td className="cell-style">{affiliate.refId}</td>
                      <td className="cell-style">
                        {new Date(affiliate.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            timeZone: "America/New_York",
                          }
                        )}
                      </td>
                      <td className="cell-style">{affiliate.totalClicks}</td>
                      <td className="cell-style"></td>
                      <td className="cell-style">
                        ${affiliate.totalSales}
                      </td>
                      <td className="cell-style">
                        {affiliate.commissionRate * 100}%
                      </td>
                      <td className="cell-style">
                        ${affiliate.totalCommissions.toFixed(2)}
                      </td>
                    </>
                  )}
                  {/* <td
                    className="cell-style"
                    onClick={() => removeAffiliate(affiliate.id)}
                  >
                    remove
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div></>
  );
}
