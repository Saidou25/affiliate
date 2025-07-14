import { IoPersonCircleOutline } from "react-icons/io5";
import { Affiliate } from "../types";
// import Spinner from "./Spinner";

import "./ProfileLookUp.css";

type Props = {
  affiliateData: Affiliate | null;
};

export default function ProfileLookUp({ affiliateData }: Props) {
//   if (!affiliateData) return <p>Loading affiliate data...</p>;

  return (
    <div className="card-profile-lookup">
      <div className="card-title-profile-lookup">
        {/* <strong className="">Reference id:&nbsp;</strong> */}
        {affiliateData?.refId}
      </div>
      <div className="row card-body-profile-lookup">
        <div className="col-6">
          <strong className="">id:&nbsp;</strong>
          {affiliateData?.id}
          <div className="">
            <strong className="">Email:&nbsp;</strong>
            {affiliateData?.email}
          </div>
          <div className="">
            <strong className="">Name:&nbsp;</strong>
            {affiliateData?.name ? (
              <span>{affiliateData?.name}</span>
            ) : (
              <span>N/A</span>
            )}
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
            {(affiliateData?.commissionRate) * 100}%
          </div>
          <div className="">
            <strong className="">Total clicks:&nbsp;</strong>
            {affiliateData?.totalClicks}
          </div>
          <div className="">
            <strong className="">Total sales:&nbsp;</strong>
            ${affiliateData?.totalSales.toFixed(2)}
          </div>
          <div className="">
            <strong className="">Total commissions:&nbsp;</strong>
            ${affiliateData?.totalCommissions.toFixed(2)}
          </div>
          <div className="">
            <strong className="">Stripe account:&nbsp;</strong>
            {affiliateData?.stripeAccountId ? (
              <span style={{ color: "green" }}>✅ Ready</span>
            ) : (
              <span style={{ color: "orange" }}>⚠️ Not ready</span>
            )}
          </div>
        </div>
        <div className="col-6 profile">
          <div className="profile-div">
            <IoPersonCircleOutline />
          </div>
        </div>
      </div>
      <div className="card-footer-profile-lookup">
        Affiliate since{" "}
        {affiliateData?.createdAt
          ? new Date(affiliateData.createdAt).toISOString()
          : "—"}
      </div>
    </div>
  );
}
