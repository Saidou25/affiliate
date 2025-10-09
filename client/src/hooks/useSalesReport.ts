import { useEffect, useState } from "react";
import { AffiliateSale } from "../types";

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
export default function useSalesReport(salesData: any) {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);
console.log(salesData)
  useEffect(() => {
    if (salesData?.getAllAffiliateSales) {
      const organizedDates = [...salesData?.getAllAffiliateSales].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setSortedDates(organizedDates);
    }
  }, [salesData]);

  useEffect(() => {
    const salesMap: { [key: string]: AffiliateSale[] } = {};

    sortedDates.forEach((sale) => {
      const date = new Date(sale.createdAt);
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!salesMap[key]) {
        salesMap[key] = [];
      }
      salesMap[key].push(sale);
    });

    const groupedArray: MonthlySalesGroup[] = Object.entries(salesMap).map(
      ([month, sales]) => ({
        month,
        sales,
      })
    );

    // Optional: sort by most recent month
    groupedArray.sort((a, b) => {
      const dateA = new Date(a.sales[0].createdAt);
      const dateB = new Date(b.sales[0].createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    setMonthlySales(groupedArray);
  }, [sortedDates]);

  return { monthlySales };
}
