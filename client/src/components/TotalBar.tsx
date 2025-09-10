import { Affiliate } from "../types";

type Props = {
  addedSales: number;
  addedCommissions: number;
  calculateCommissionsByStatus: { unpaid: number; paid: number };
  findClicks?: number;
  currentMonth: string;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  monthSales?: any;
  me?: Affiliate;
};

export default function TotalBar({
  addedSales,
  addedCommissions,
  calculateCommissionsByStatus,
  findClicks,
  currentMonth,
  clicksPerMonth,
  monthSales,
  salesPerMonth,
  me,
}: Props) {
  // for affiliate's role
  const xtractTotalClicks = () => {
    if (clicksPerMonth?.length) {
      let month = clicksPerMonth[0]?.data.filter(
        (click: any) => click.x === currentMonth
      );
      return month[0]?.y;
    }
  };

  // for affiliate's role
  const xtractTotalSales = () => {
    if (salesPerMonth?.length) {
      let month = salesPerMonth[0]?.data.filter(
        (sale: any) => sale.x === currentMonth
      );
      return month[0].y;
    }
  };

  return (
    <>
      <br />
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th className="cell-style-top">Month</th>
            <th className="cell-style-top">Total Clicks</th>
            <th className="cell-style-top">Total Sales</th>
            <th className="cell-style-top">Total Sales Amount</th>
            <th className="cell-style-top">Total Commissions</th>
            <th className="cell-style-top">Unpaid Commissions</th>
            <th className="cell-style-top">Paid Commissions</th>
            <th className="cell-style-top">Earnings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="cell-style">{currentMonth}</td>
            {me?.role === "admin" ? (
              <td className="cell-style">{findClicks}</td>
            ) : (
              <td className="cell-style">{xtractTotalClicks()}</td>
            )}
            {me?.role === "admin" ? (
              <td className="cell-style">{monthSales?.length}</td>
            ) : (
              <td className="cell-style">{xtractTotalSales()}</td>
            )}

            <td className="cell-style">${addedSales}</td>
            <td className="cell-style">${addedCommissions}</td>
            <td className="cell-style">
              ${calculateCommissionsByStatus.unpaid}
            </td>
            <td className="cell-style">${calculateCommissionsByStatus.paid}</td>
            <td className="cell-style">
              {me?.role === "affiliate"
                ? `$${calculateCommissionsByStatus.paid.toFixed(2)}`
                : `$${(addedSales - calculateCommissionsByStatus.paid).toFixed(
                    2
                  )}`}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
