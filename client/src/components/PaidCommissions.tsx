import { useQuery } from "@apollo/client";
import { GET_ALLAFFILIATESALES } from "../utils/queries";
import { AffiliateSale } from "../types";
// import DisplayTable from "./DisplayTable";

export default function PaidCommissions() {
  const { data } = useQuery(GET_ALLAFFILIATESALES);

  const paidByMonth: { [key: string]: AffiliateSale[] } = {};
  if (data?.getAllAffiliateSales) {
    const paid =
      data?.getAllAffiliateSales.filter(
        (sale: AffiliateSale) => sale.commissionStatus === "paid"
      ) || [];


    for (let p of paid) {
      const monthKey = new Date(p.timestamp).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "long",
        year: "numeric",
      });

      if (!paidByMonth[monthKey]) {
        paidByMonth[monthKey] = [];
      }

      paidByMonth[monthKey].push(p);
    }

    // console.log("paidByMonth: ", paidByMonth);
   
  }

  return (
    <div>
      {/* <DisplayTable data={paidByMonth}/> */}
    </div>
  );
}
