import { AffiliateSale } from "../graphql/types";

export function generateReportHTML({
  monthSales,
  currentMonth,
  addedSales,
  addedCommissions,
  clicks,
}: {
  monthSales: AffiliateSale[];
  currentMonth: string;
  addedSales: number;
  addedCommissions: number;
  clicks: number;
}) {
  // Build rows
  const rows = monthSales
    .map(
      (sale: any) => `
    <tr>
      <td>${new Date(sale.timestamp).toLocaleDateString("en-US", {
        timeZone: "America/New_York",
      })}</td>
      <td>${sale.buyerEmail}</td>
      <td>${sale.event}</td>
      <td>${sale.productId}</td>
      <td>${sale.refId}</td>
      <td>$${sale.amount}</td>
      <td>$${sale.commissionEarned}</td>
    </tr>
  `
    )
    .join("");

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; background-color: #f3eedc; padding: 2%; border-radius: 10px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          h3 { color: black; }
        </style>
      </head>
      <body>
        <h3>Detailed Report for ${currentMonth}</h3>
        <table>
          <thead>
            <tr>
              <th>Purchase date</th>
              <th>Buyer's email</th>
              <th>Product</th>
              <th>Product ID</th>
              <th>Reference ID</th>
              <th>Price</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <br />
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Clicks</th>
              <th>Total Sales</th>
              <th>Total Commissions</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${currentMonth}</td>
              <td>${clicks}</td>
              <td>$${addedSales}</td>
              <td>$${addedCommissions}</td>
              <td>$${addedSales - addedCommissions}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;
}
