type Props = {
  addedSales: number;
  addedCommissions: number;
  currentMonth: string;
  salesPerMonth: any;
  clicksPerMonth: any;
};

export default function TotalBar({
  addedSales,
  addedCommissions,
  currentMonth,
  salesPerMonth,
  clicksPerMonth,
}: Props) {
  const xtractTotalSales = () => {
    let month = salesPerMonth[0].data.filter(
      (sale: any) => sale.x === currentMonth
    );
    return month[0].y;
  };

  const xtractTotalClicks = () => {
    let month = clicksPerMonth[0].data.filter(
      (click: any) => click.x === currentMonth
    );
    return month[0].y;
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
            <td className="cell-style">{xtractTotalClicks()}</td>
            <td className="cell-style">{xtractTotalSales()}</td>
            <td className="cell-style">${addedSales}</td>
            <td className="cell-style">${addedCommissions}</td>
            <td className="cell-style">${addedCommissions}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
