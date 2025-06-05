// import { useQuery } from "@apollo/client";
// import { QUERY_ME } from "../utils/queries";

import { AffiliateSale } from "../types";

export default function useAddMonthCommissions(monthSales: AffiliateSale[]) {
  // const { data } = useQuery(QUERY_ME);
  // const me = data?.me || {};
  // const rate = me.commissionRate;

  console.log("month Sales: ", monthSales);
  const calculateCommissionsByStatus = () => {
    let totalUnpaid = 0;
    let totalPaid = 0;
    for (let sale of monthSales) {
      if (sale.commissionStatus === "unpaid") {
        totalUnpaid += sale.commissionEarned;
      } else {
        totalPaid += +sale.commissionEarned;
      }
    }
    return { unpaid: +totalUnpaid.toFixed(2), paid: +totalPaid.toFixed(2) };
  };

  const addedCommissions = () => {
    const total = monthSales.reduce(
      (acc: number, commission: any) => acc + commission.commissionEarned,
      0
    );
    return +total.toFixed(2);
  };
  return { addedCommissions, calculateCommissionsByStatus };
}
