import { useQuery } from "@apollo/client";
import { GET_ALLAFFILIATESALES } from "../utils/queries";
import { AffiliateSale } from "../types";
// import DisplayTable from "./DisplayTable";

export default function unPaidCommissions() {
  const { data } = useQuery(GET_ALLAFFILIATESALES);

  const unpaidByMonth: { [key: string]: AffiliateSale[] } = {};
  if (data?.getAllAffiliateSales) {
    const unpaid =
      data?.getAllAffiliateSales.filter(
        (sale: AffiliateSale) =>
          sale.commissionStatus === "unpaid" || !sale.commissionStatus
      ) || [];


    for (let p of unpaid) {
      const monthKey = new Date(p.timestamp).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "long",
        year: "numeric",
      });

      if (!unpaidByMonth[monthKey]) {
        unpaidByMonth[monthKey] = [];
      }

      unpaidByMonth[monthKey].push(p);
    }

    // console.log("unpaidByMonth: ", unpaidByMonth);
  }

  return <div>
    {/* <DisplayTable data={unpaidByMonth} /> */}
  </div>;
}
