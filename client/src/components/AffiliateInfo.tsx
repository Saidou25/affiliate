import { useQuery } from "@apollo/client";
import {
  GET_AFFILIATECLICKLOGS,
  GET_AFFILIATESALES,
  QUERY_ME,
} from "../utils/queries";
import Products from "./Products";

import "./AffiliateInfo.css";

export default function AffiliateInfo() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId },
    skip: !refId,
  });

  const { data: clickData } = useQuery(GET_AFFILIATECLICKLOGS, {
    variables: { refId },
    skip: !refId,
  });

  // console.log(clickData);

  if (!refId) return <p>Loading affiliate info...</p>;

  return (
    <div className="my-profile">
      <h1>Affiliate's Dashboard</h1>
      <h2>My Profile</h2>
      {me.name && (
        <>
          <strong>name:</strong>
          {me.name}
          <br />
        </>
      )}
      {me.email && (
        <>
          <strong>email - </strong>
          {me.email}
          <br />
        </>
      )}
      {me.id && (
        <>
          <strong>id - </strong>
          {me.id}
          <br />
        </>
      )}
      {me.refId && (
        <>
          <strong>your reference id - </strong>
          {me.refId} <br />
        </>
      )}

      {me.totalClicks && (
        <>
          <strong>total clicks - </strong>
          {me.totalClicks}
          <br />
        </>
      )}

      {me.totalComissions && (
        <>
          <strong>total comissions - </strong>
          {me.totalComissions}
          <br />
        </>
      )}
      <h2>My Sales:</h2>
      {salesData &&
        salesData.getAffiliateSales.map((sale: any, index: number) => (
          <div key={index} className="">
            <span className="">
              <strong className="">From - </strong>
              {sale.buyerEmail}
            </span>
            <span className="">
              <strong className="">Event - </strong>
              {sale.event}
            </span>
            <span className="">
              <strong className="">Product Id - </strong>
              {sale.productId}
            </span>
            <span className="">
              <strong className="">Reference Id - </strong>
              {sale.refId}
            </span>
            <span className="">
              <strong className="">Purchase Time - </strong>
              {sale.timestamp}
            </span>
            <span className="">
              <strong className="">Price - </strong>
              {sale.amount}
            </span>
          </div>
        ))}
      <h2>Total Clicks:</h2>
      <div className="clicks-container">
        {clickData &&
          clickData.getAffiliateClickLogs.map((data: any, i: number) => (
            <div className="card" key={i}>
              <div className="card-title">{refId}</div>
              <br />
              <div className="card-body">
                <strong>created at - {data.createdAt}</strong>
                <br />
                <strong>updated at - {data.updatedAt}</strong>
              </div>
              <br />
              <div className="card-footer">{data.id}</div>
            </div>
          ))}
      </div>
      <Products />
    </div>
  );
}
