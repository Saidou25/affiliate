import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

type Props = {
  addedSales: number;
  addedCommissions: number;
  findClicks?: number;
  currentMonth: string;
  salesPerMonth?: any;
  clicksPerMonth?: any;
  monthSales?: any;
};

export default function TotalBar({
  addedSales,
  addedCommissions,
  findClicks,
  currentMonth,
  clicksPerMonth,
  monthSales,
  salesPerMonth,
}: Props) {
  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  // for affiliate's role
  const xtractTotalClicks = () => {
    if (clicksPerMonth?.length) {
      let month = clicksPerMonth[0]?.data.filter(
        (click: any) => click.x === currentMonth
      );
      return month[0].y;
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
            <th className="cell-style">Month</th>
            <th className="cell-style">Total Clicks</th>
            <th className="cell-style">Total Sales</th>
            <th className="cell-style">Total Sales Amount</th>
            <th className="cell-style">Total Commissions</th>
            <th className="cell-style">Earnings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="cell-style">{currentMonth}</td>
            {me.role === "admin" ? (
              <td className="cell-style">{findClicks}</td>
            ) : (
              <td className="cell-style">{xtractTotalClicks()}</td>
            )}
            {me.role === "admin" ? (
              <td className="cell-style">{monthSales?.length}</td>
            ) : (
              <td className="cell-style">{xtractTotalSales()}</td>
            )}

            <td className="cell-style">${addedSales}</td>
            <td className="cell-style">${addedCommissions}</td>
            <td className="cell-style">
              ${(addedSales - addedCommissions).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
