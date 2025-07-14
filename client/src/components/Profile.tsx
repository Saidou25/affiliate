import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Profile() {
  const [settings, setSettings] = useState(false);
  const location = useLocation();

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  useEffect(() => {
    if (location.pathname.includes("settings")) {
      setSettings(true);
    } else {
      setSettings(false);
    }
  }, [location.pathname]);

  if (settings) {
    return (
      <p>
        {me.name && (
          <>
            <strong>Name - </strong>
            {me.name}
            <br />
          </>
        )}
        {me.email && (
          <>
            <strong>Email - </strong>
            {me.email}
            <br />
          </>
        )}
        {me.refId && (
          <>
            <strong>My reference id - </strong>
            {me.refId} <br />
          </>
        )}
        {me.commissionRate && (
          <>
            <strong>Commission rate - </strong>
            {me.commissionRate * 100}%<br />
          </>
        )}
      </p>
    );
  }
  return (
    <div
      className="profile-container"
      style={{
        backgroundColor: "#ddd",
        padding: "2%",
        borderRadius: "10px",
      }}
    >
      {me.name && (
        <>
          <strong>Name - </strong>
          {me.name}
          <br />
        </>
      )}
      {me.email && (
        <>
          <strong>Email - </strong>
          {me.email}
          <br />
        </>
      )}
      {me.refId && (
        <>
          <strong>My reference id - </strong>
          {me.refId} <br />
        </>
      )}
      {me.commissionRate && (
        <>
          <strong>Commission rate - </strong>
          {me.commissionRate * 100}%<br />
        </>
      )}
    </div>
  );
}
