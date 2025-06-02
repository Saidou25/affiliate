import { useQuery } from "@apollo/client";
import { GET_ALLREPORTS } from "../utils/queries";

export default function DataCenter() {
  const { data, loading, error } = useQuery(GET_ALLREPORTS);
  console.log(data);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <div>
      <h2>Data Center</h2>
      <div className="res">
        <h3>Saved reports</h3>
        {data &&
          data.getAllReports.map((d: any) => (
            <div key={d.month}>
              <span className="view-line">Saved report for {d.month} </span>
            </div>
          ))}
      </div>
    </div>
  );
}
