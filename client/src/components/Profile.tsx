import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

export default function Profile() {
  const { data } = useQuery(QUERY_ME);
  const me = data.me || {};

  return (
    <>
      <h2>My Profile</h2>
      <div
        className="profile-container"
        style={{
          backgroundColor: "black",
          padding: "2%",
          borderRadius: "10px",
        }}
      >
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
      </div>
    </>
  );
}
