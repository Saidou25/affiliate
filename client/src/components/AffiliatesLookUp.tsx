import { useState } from "react";
import DetailedReport from "./DetailedReport";
import { useLazyQuery } from "@apollo/client";
import { GET_AFFILIATE_BY_REFID } from "../utils/queries";
import { Affiliate } from "../types";
import { IoPersonCircleOutline } from "react-icons/io5";

import "./AffiliatesLookUp.css";
import NotificationForm from "./NotificationForm";

export default function AffiliatesLookUp() {
  const [affiliateData, setAffiliateData] = useState<Affiliate | null>(null);
  const [affiliateRefId, setAffiliateRefId] = useState("");
  const [submittedRefId, setSubmittedRefId] = useState("");
  const [show, setShow] = useState(false);

  const [getAffiliateByRefId] = useLazyQuery(GET_AFFILIATE_BY_REFID);
  //   const { salesPerMonth } = useSalesTracker(affiliateRefId);

  const handleChange = (e: string) => {
    setAffiliateRefId(e);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!affiliateRefId.trim()) {
      console.log("⚠️ No refId provided");
      return;
    }
    try {
      const { data } = await getAffiliateByRefId({
        variables: { refId: affiliateRefId.trim() },
      });
      if (data) {
        setAffiliateData(data.getAffiliateByRefId);
      }
    } catch (error) {
      console.log(error);
    }
    // console.log("✅ Submitted refId:", affiliateRefId);
    setSubmittedRefId(affiliateRefId.trim());
    setShow(true);
    setAffiliateRefId("");
  };

  console.log("affiliateData: ", affiliateData);

  return (
    <>
      <h2>Affiliate Lookup</h2>
      <div className="res">
        <div
          className="form-container"
          style={{ borderRadius: "10px", width: "40%" }}
        >
          <form
            className="form"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onSubmit={handleSubmit}
          >
            <label className="" htmlFor="refId-input" style={{ width: "100%" }}>
              Search Affiliate
            </label>
            <input
              id="refId-input"
              type="text"
              placeholder="please enter affiliate's reference ID..."
              style={{
                height: "30px",
                fontStyle: "italic",
                width: "100%",
                padding: "1%",
              }}
              value={affiliateRefId}
              onChange={(e) => handleChange(e.target.value)}
            />
            <div className="" style={{ paddingLeft: "4%", width: "100%" }}>
              <button className="" type="submit" disabled={!affiliateRefId}>
                Find Affiliate
              </button>
            </div>
          </form>
        </div>
        <br />
        <br />
        <div className="card">
          <div className="card-title">
            <strong className="">id:&nbsp;</strong>
            {affiliateData?.id}
          </div>
          <div className="row card-body">
            <div className="col-6">
              <div className="">
                <strong className="">Email:&nbsp;</strong>
                {affiliateData?.email}
              </div>
              <div className="">
                <strong className="">Name:&nbsp;</strong>
                {affiliateData?.name ? <span>{affiliateData?.name}</span> : <span>N/A</span>}
              </div>
              <div className="">
                <strong className="">Reference id:&nbsp;</strong>
                {affiliateData?.refId}
              </div>
              <div className="">
                <strong className="">Stripe account:&nbsp;</strong>
                {affiliateData?.stripeAccountId}
              </div>
              <div className="">
                <strong className="">Commission rate:&nbsp;</strong>
                {affiliateData?.commissionRate}
              </div>
              <div className="">
                <strong className="">Total clicks:&nbsp;</strong>
                {affiliateData?.totalClicks}
              </div>
              <div className="">
                <strong className="">Total sales:&nbsp;</strong>
                {affiliateData?.totalSales.toFixed(2)}
              </div>
              <div className="">
                <strong className="">Total commissions:&nbsp;</strong>
                {affiliateData?.totalCommissions.toFixed(2)}
              </div>
            </div>
            <div className="col-6 profile">
              <div className="profile-div">
                <IoPersonCircleOutline />
              </div>
            </div>
          </div>
          <div className="card-footer">
            Affiliate since {affiliateData?.createdAt?.toISOString()}
          </div>
        </div>
        <NotificationForm />
        {!affiliateData?.totalCommissions &&
          !affiliateData?.totalClicks &&
          !affiliateData?.totalSales && (
            <>
              <h2>Report</h2>
              <span>No activity so far.</span>
            </>
          )}
        {show && <DetailedReport refId={submittedRefId} />}
      </div>
    </>
  );
}
