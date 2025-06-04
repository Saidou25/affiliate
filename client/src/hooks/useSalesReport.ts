import { useEffect, useState } from "react";

interface AffiliateSale {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  commissionStatus: string;
  timestamp: string;
  amount: number;
  productId: string;
  __typename?: string;
}

interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
export default function useSalesReport(salesData: any) {
  const [sortedDates, setSortedDates] = useState<AffiliateSale[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesGroup[]>([]);

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
      const date = new Date(sale.timestamp);
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
      const dateA = new Date(a.sales[0].timestamp);
      const dateB = new Date(b.sales[0].timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    setMonthlySales(groupedArray);
  }, [sortedDates]);
  // console.log("monthly sales: ", monthlySales);
  return { monthlySales };
}
