
export interface MonthlySalesGroup {
  month: string;
  sales: AffiliateSale[];
}
interface AffiliateSale {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  timestamp: string | Date;
  amount: number;
  productId: string;
  __typename?: string; // Optional if you're not using it
}

export function groupSalesByMonth(sales: AffiliateSale[]): MonthlySalesGroup[] {
  const salesMap: { [key: string]: AffiliateSale[] } = {};

  sales.forEach((sale) => {
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
    ([month, sales]) => ({ month, sales })
  );

  // Sort by newest first
  groupedArray.sort((a, b) => {
    const dateA = new Date(a.sales[0].timestamp);
    const dateB = new Date(b.sales[0].timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  return groupedArray;
}
