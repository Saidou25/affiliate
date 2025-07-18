import { useEffect, useState } from "react";
import DetailedReport from "./DetailedReport";
import { useLazyQuery } from "@apollo/client";
import { GET_AFFILIATE_BY_REFID } from "../utils/queries";
import { Affiliate } from "../types";
// import { IoPersonCircleOutline } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import NotificationForm from "./NotificationForm";
import AffiliateLookUpNav from "./AffiliateLookUpNav";
import ProfileLookUp from "./ProfileLookUp";

import "./AffiliatesLookUp.css";
import EmailForm from "./EmailForm";
import Button from "./Button";

export default function AffiliatesLookUp() {
  const [affiliateData, setAffiliateData] = useState<Affiliate | null>(null);
  const [affiliateRefId, setAffiliateRefId] = useState("");
  const [submittedRefId, setSubmittedRefId] = useState("");
  const [show, setShow] = useState(false);

  const location = useLocation();
  const refId = location.state?.refId;

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
    setSubmittedRefId(affiliateRefId.trim());
    setShow(true);
    setAffiliateRefId("");
  };

  useEffect(() => {
    const findAffiliate = async (refId: string) => {
      try {
        const { data } = await getAffiliateByRefId({
          variables: { refId },
        });
        if (data) {
          setAffiliateData(data.getAffiliateByRefId);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (refId) {
      findAffiliate(refId);
    }
  }, []);

  return (
    <>
      <br />
      <br />
      <div className="">
        <span style={{ fontSize: "2rem", fontWeight: "400" }}>
          Lookup affiliate
        </span>
        <p className="p-text">Search affiliate by reference id or email.</p>
        <br />
        <div className="form-container-lookup">
          {/* <h3>Lookup affiliate</h3> */}
          <br />
          <form
            className="form-lookup"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
            onSubmit={handleSubmit}
          >
            <label
              className=""
              htmlFor="refId-input"
              style={{ width: "100%", fontWeight: "600" }}
            >
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
              <Button
                className="blue-btn"
                type="submit"
                disabled={!affiliateRefId}
              >
                Find Affiliate
              </Button>
            </div>
          </form>
        </div>
        <br />
        <br />
        <br />
        <br />
        {affiliateData && (
          <AffiliateLookUpNav>
            <ProfileLookUp affiliateData={affiliateData} />
            <NotificationForm affiliateData={affiliateData} />
            <EmailForm affiliateData={affiliateData} />
          </AffiliateLookUpNav>
        )}
        <br />
        <br />
        <br />

        {!affiliateData?.totalCommissions ||
          !affiliateData?.totalClicks ||
          (!affiliateData?.totalSales && (
            <>
              <h2>Report</h2>
              <span>No activity so far.</span>
            </>
          ))}
        {show && <DetailedReport refId={submittedRefId} />}
      </div>
    </>
  );
}
