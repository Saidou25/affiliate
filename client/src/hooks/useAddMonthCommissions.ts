export default function useAddMonthCommissions(monthSales: any) {
  const addedCommissions = () => {
    const total = monthSales.reduce(
      (acc: number, commission: any) => acc + commission.commissionEarned,
      0
    );
    return total.toFixed(2);
  };
  addedCommissions();

  return addedCommissions;
}
