// import { DELETE_AFFILIATE } from "../utils/mutations";

import { useEffect, useState } from "react";
import {
  Affiliate,
  CheckStripeStatusData,
  CheckStripeStatusVars,
  GetAffiliateByRefIdData,
  GetAffiliateByRefIdVars,
} from "../types";
import "./DetailedReport.css";
import Spinner from "./Spinner";
import { CHECK_STRIPE_STATUS, GET_AFFILIATE_BY_REFID } from "../utils/queries";
import { useLazyQuery } from "@apollo/client";

type Props = {
  data: any;
  loading: boolean;
  errorText: string | undefined;
};

export default function AffiliatesList({ data, loading, errorText }: Props) {
  //  Create a state to track Stripe statuses per affiliate
  const [stripeStatusMap, setStripeStatusMap] = useState<
    Record<string, boolean>
  >({});
  const [stripeLoadingMap, setStripeLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [getAffiliateByRefId] = useLazyQuery<
    GetAffiliateByRefIdData,
    GetAffiliateByRefIdVars
  >(GET_AFFILIATE_BY_REFID);
  const [checkStripeStatus] = useLazyQuery<
    CheckStripeStatusData,
    CheckStripeStatusVars
  >(CHECK_STRIPE_STATUS);

  const handleCheckEnrollment = async (refId: string) => {
    setStripeLoadingMap((prev) => ({ ...prev, [refId]: true }));
    try {
      const affiliateResult = await getAffiliateByRefId({
        variables: { refId },
      });
      const affiliateId = affiliateResult?.data?.getAffiliateByRefId
        ?.id as string;

      if (!affiliateId) {
        setStripeStatusMap((prev) => ({ ...prev, [refId]: false }));
        setStripeLoadingMap((prev) => ({ ...prev, [refId]: false }));
        return;
      }

      const stripeResult = await checkStripeStatus({
        variables: { affiliateId },
      });
      const stripeStatus = stripeResult?.data?.checkStripeStatus;

      const ready: boolean =
        Boolean(stripeStatus?.charges_enabled) &&
        Boolean(stripeStatus?.payouts_enabled);

      setStripeStatusMap((prev) => ({ ...prev, [refId]: ready }));
    } catch (err) {
      console.error("Error checking Stripe enrollment:", err);
      setStripeStatusMap((prev) => ({ ...prev, [refId]: false }));
    } finally {
      setStripeLoadingMap((prev) => ({ ...prev, [refId]: false }));
    }
  };

  // useEffect to trigger checks on render
  useEffect(() => {
    const affiliatesData = data?.getAffiliates;
    if (!affiliatesData) return;

    const uniqueRefIds: string[] = Array.from(
      new Set(
        affiliatesData.map((affiliateData: Affiliate) => affiliateData.refId)
      )
    );

    uniqueRefIds.forEach((refId) => {
      handleCheckEnrollment(refId);
    });
  }, [data]);

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
              Total sale's force has {data?.getAffiliates?.length - 1}{" "}
              affiliates{" "}
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
                  {/* <th className="cell-style-top">Affiliate ID</th> */}
                  <th className="cell-style-top">Reference ID</th>
                  <th className="cell-style-top">Affiliate since</th>
                  <th className="cell-style-top">Total Clicks(yearly)</th>
                  <th className="cell-style-top">Total Sales(yearly)</th>
                  <th className="cell-style-top">
                    Total Sale's amount(yearly)
                  </th>
                  <th className="cell-style-top">Commission Rate</th>
                  <th className="cell-style-top">Commissions Earned(yearly)</th>
                  <th className="cell-style">Ready for Payments</th>
                </tr>
              </thead>
              <tbody>
                {data?.getAffiliates?.map((affiliate: any) => (
                  <tr key={affiliate.id}>
                    {affiliate.role === "affiliate" && (
                      <>
                        <td className="cell-style">{affiliate.email}</td>
                        {/* <td className="cell-style">{affiliate.id}</td> */}
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
                        <td className="cell-style">${affiliate.totalSales}</td>
                        <td className="cell-style">
                          {affiliate.commissionRate * 100}%
                        </td>
                        <td className="cell-style">
                          ${affiliate.totalCommissions.toFixed(2)}
                        </td>
                        <td className="cell-style">
                          {stripeLoadingMap[affiliate.refId] ? (
                            <Spinner />
                          ) : stripeStatusMap[affiliate.refId] === true ? (
                            <span style={{ color: "green" }}>✅ Ready</span>
                          ) : (
                            <span style={{ color: "orange" }}>
                              ⚠️ Not ready
                            </span>
                          )}
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
      </div>
    </>
  );
}
