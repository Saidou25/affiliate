import { useQuery } from "@apollo/client";
import { GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";

export default function SalesData() {
  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};
  const refId = me?.refId;

  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId },
    skip: !refId,
  });

  return (
    <div>
      <h2>My Sales:</h2>
      <strong className="">
        Your total of sales so far is - {me.totalSales}
      </strong>
      <br />
      <br />
      <div
        style={{
          backgroundColor: "black",
          padding: "2%",
          borderRadius: "10px",
        }}
      >
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
      </div>
    </div>
  );
}
