import { IoMdClose } from "react-icons/io";

interface AffiliateSale {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  timestamp: string;
  amount: number;
  productId: string;
  __typename?: string; // Optional if you're not using it
}

type Props = {
  monthSales: AffiliateSale[];
  currentMonth: string;
  setShowReport: (item: number | null) => void;
}

export default function DetailedReportView({ monthSales, currentMonth, setShowReport }: Props) {
   const cellStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
  };

  return (
    <div>
       <h2>Detailed Report for {currentMonth}</h2>
      <div className="res">
        <IoMdClose onClick={() => setShowReport(null)} />
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
            {monthSales &&
              monthSales?.map((sale, index) => (
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
    </div>
  )
}
