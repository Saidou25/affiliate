import { AffiliateSale } from "../types";

export default function useAddMonthCommissions(monthSales: AffiliateSale[] = []) {
  const amt = (v: unknown) => Number(v ?? 0); // handles number | null | undefined | string
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const calculateCommissionsByStatus = () => {
    let totalUnpaid = 0;
    let totalPaid = 0;

    for (const sale of monthSales) {
      const value = amt((sale as any).commissionEarned); // or sale.commissionEarned ?? 0 if typed that way
      if ((sale as any).commissionStatus === "unpaid") {
        totalUnpaid += value;
      } else {
        totalPaid += value;
      }
    }
    return { unpaid: round2(totalUnpaid), paid: round2(totalPaid) };
  };

  const addedCommissions = () => {
    const total = monthSales.reduce((acc, sale: any) => acc + amt(sale.commissionEarned), 0);
    return round2(total);
  };

  return { addedCommissions, calculateCommissionsByStatus };
}
