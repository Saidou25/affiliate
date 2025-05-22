import { useQuery } from "@apollo/client";
import { GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";

export default function DetailedReport() {
  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};
  const refId = me?.refId;

  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId },
    skip: !refId,
  });

//   console.log("sales data: ", salesData);

  const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
  };

  return (
    <>
      <h2>Detailed Report</h2>
      <div className="res">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={cellStyle}>Purchase date</th>
              <th style={cellStyle}>Buyer's email</th>
              <th style={cellStyle}>Product</th>
              <th style={cellStyle}>Product ID</th>
              <th style={cellStyle}>Reference ID</th>
              <th style={cellStyle}>Price</th>
              <th style={cellStyle}>Commission</th>
            </tr>
          </thead>
          <tbody>
            {salesData &&
              salesData.getAffiliateSales.map((sale: any, index: number) => (
                <tr key={index}>
                  <td style={cellStyle}>
                    {new Date(sale.timestamp).toLocaleDateString("en-US", {
                      timeZone: "America/New_York",
                    })}
                  </td>
                  <td style={cellStyle}>{sale.buyerEmail}</td>
                  <td style={cellStyle}>{sale.event}</td>
                  <td style={cellStyle}>{sale.productId}</td>
                  <td style={cellStyle}>{sale.refId}</td>
                  <td style={cellStyle}>${sale.amount}</td>
                  <td style={cellStyle}>${sale.commissionEarned}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
