import React, { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { nanoid } from "nanoid";
import { useReferralCode } from "./hooks/useReferralCode";

import "./index.css";

const REGISTER_AFFILIATE = gql`
  mutation RegisterAffiliate(
    $name: String!
    $email: String!
    $refId: String!
    $totalClicks: Int!
    $totalCommissions: Int!
  ) {
    registerAffiliate(
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
    ) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;

const GET_AFFILIATES = gql`
  query GetAffiliates {
    getAffiliates {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;

interface Affiliate {
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
}

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [refId, setRefId] = useState("");
  const [totalClicks, setTotalClicks] = useState("");
  const [totalCommissions, setTotalCommissions] = useState("");

  const referralCode = useReferralCode();
  console.log("reference code: ", referralCode);

  const { data, loading, error } = useQuery<{ getAffiliates: Affiliate[] }>(
    GET_AFFILIATES
  );

  const [registerAffiliate] = useMutation(REGISTER_AFFILIATE, {
    onCompleted: (data) => {
      console.log("User created:", data.registerAffiliate);
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
    },
  });

  const dynamicReferralCode = nanoid(8);
  // const linkStructure = `https://princetongreen.org/?ref=${refId}`;

  const deleteAffiliate = (refId: string) => {
    // console.log(data);
    // console.log(referralCode);
    // console.log(refId);
    if (refId === referralCode) {
      // const affiliate = data.getAffiliates.filter(
      //   (d: Affiliate) => d.refId === referralCode
      // );
      // console.log(affiliate[0].name);
      console.log("yes: ", refId);
    } else {
      console.log("not the one");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerAffiliate({
      variables: {
        name,
        email,
        refId: dynamicReferralCode,
        totalClicks: +totalClicks,
        totalCommissions: +totalCommissions,
      },
    });
  };

  return (
    <div>
      <h1> Register Affiliate</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="text"
          value={refId}
          onChange={(e) => setRefId(e.target.value)}
          placeholder="ref id"
        />
        <input
          type="number"
          value={totalClicks}
          onChange={(e) => setTotalClicks(e.target.value)}
          placeholder="total clicks"
        />
        <input
          type="number"
          value={totalCommissions}
          onChange={(e) => setTotalCommissions(e.target.value)}
          placeholder="total comission"
        />
        <button type="submit">Create User</button>
      </form>
      <h2>All Users</h2>
      {loading && <p>Loading users...</p>}
      {error && <p>Error fetching users: {error.message}</p>}
      {data &&
        data.getAffiliates.map((affiliate: any) => (
          <div key={affiliate.id}>
            <strong>{affiliate.name}</strong> - {affiliate.email} -{" "}
            {affiliate.refId} - {affiliate.totalClicks} -{" "}
            {affiliate.totalCommissions}
            <button onClick={() => deleteAffiliate(affiliate.refId)}>delete</button>
          </div>
        ))}
    </div>
  );
}

export default App;
