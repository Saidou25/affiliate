import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

export default function AffiliateInfo() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || [];
  return (
    <div>
      <h2>My info</h2>
      {me.name && (
        <>
          <strong>name:</strong>
          {me.name}
          <br />
        </>
      )}
      {me.email && (
        <>
          <strong>email - </strong>
          {me.email}
          <br />
        </>
      )}
      {me.id && (
        <>
          <strong>id - </strong>
          {me.id}
          <br />
        </>
      )}
      {me.refId && (
        <>
          <strong>your reference id - </strong>
          {me.refId} <br />
        </>
      )}

      {me.totalClicks && (
        <>
          <strong>total clicks - </strong>
          {me.totalClicks}
          <br />
        </>
      )}

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
