import { useState } from "react";
// import { useSalesTracker } from "../hooks/useSalesTracker";np8aKVvD
import DetailedReport from "./DetailedReport";

export default function AffiliatesLookUp() {
  const [affiliateRefId, setAffiliateRefId] = useState("");
  const [submittedRefId, setSubmittedRefId] = useState("");
  const [show, setShow] = useState(false);

  //   const { salesPerMonth } = useSalesTracker(affiliateRefId);

  const handleChange = (e: string) => {
    setAffiliateRefId(e);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!affiliateRefId.trim()) {
      console.log("⚠️ No refId provided");
      return;
    }

    // console.log("✅ Submitted refId:", affiliateRefId);
    setSubmittedRefId(affiliateRefId.trim());
    setShow(true);
    setAffiliateRefId("");
  };

  //   console.log("sales per month: ", salesPerMonth);

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
              <button className="" type="submit"
              disabled={!affiliateRefId}>
                Find Affiliate
              </button>
            </div>
          </form>
        </div>
        {show && <DetailedReport refId={submittedRefId} />}
      </div>
    </>
  );
}
