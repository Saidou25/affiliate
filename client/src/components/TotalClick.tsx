import { useQuery } from "@apollo/client";
import { GET_AFFILIATECLICKLOGS, QUERY_ME } from "../utils/queries";

export default function TotalClick() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const refId = me?.refId;

  const { data: clickData } = useQuery(GET_AFFILIATECLICKLOGS, {
    variables: { refId },
    skip: !refId,
  });
  return (
    <div>
      {" "}
      <h2>Total Clicks:</h2>
      <div className="clicks-container">
        {clickData &&
          clickData.getAffiliateClickLogs.map((data: any, i: number) => (
            <div className="card" key={i}>
              <div className="card-title">{refId}</div>
              <br />
              <div className="card-body">
                <strong>created at - {data.createdAt}</strong>
                <br />
                <strong>updated at - {data.updatedAt}</strong>
              </div>
              <br />
              <div className="card-footer">{data.id}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
