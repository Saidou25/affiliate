import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

export default function Commissions() {
  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};

  return (
    <div>
      {" "}
      {me.totalComissions && (
        <>
          <strong>total comissions - </strong>
          {me.totalComissions}
          <br />
        </>
      )}
    </div>
  );
}
