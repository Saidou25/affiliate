import { useQuery } from "@apollo/client";
import { GET_ALLAFFILIATESALES } from "../utils/queries";

interface AffiliateSale {
  refId: String;
  email: String;
  event: String;
}

export default function AffiliateSalesList() {
  const {
    data: AffiliateSalesData,
    loading: loadingAffiliateSales,
    error: errorAffiliateSales,
  } = useQuery<{ getAllAffiliateSales: AffiliateSale[] }>(
    GET_ALLAFFILIATESALES
  );

  return (
    <div>
      {" "}
      <h2>All tracked AffiliateSales</h2>
      <strong style={{ color: "white" }}></strong>
      {loadingAffiliateSales && <p>Loading AffiliateSales...</p>}
      {errorAffiliateSales && (
        <p>Error fetching AffiliateSales: {errorAffiliateSales.message}</p>
      )}
      {AffiliateSalesData &&
        AffiliateSalesData.getAllAffiliateSales.map((AffiliateSale: any, i) => (
          <div key={i}>
            <strong>{AffiliateSale.event}</strong> - {AffiliateSale.name} -{" "}
            {AffiliateSale.email} -{AffiliateSale.refId}
            <br />
          </div>
        ))}
    </div>
  );
}
