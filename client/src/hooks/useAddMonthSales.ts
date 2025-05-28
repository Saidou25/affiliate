export default function useAddMonthSales(
  monthSales: any,
) {
  const addedSales = () => {
    const total = monthSales.reduce(
      (acc: number, sale: any) => acc + sale.amount,
      0
    );
    return total;
  };
  addedSales();
  return addedSales;
}
