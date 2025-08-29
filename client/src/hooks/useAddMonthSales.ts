import { AffiliateSale } from "../types";

export default function useAddMonthSales(
  monthSales: any,
) {
  const addedSales = () => {
    console.log("monthSales from hook: ", monthSales);
    const total = monthSales.reduce(
      (acc: number, sale: AffiliateSale) => acc + (sale.subtotal ?? 0),
      0
    );
    return total;
  };
  addedSales();
  return addedSales;
}
