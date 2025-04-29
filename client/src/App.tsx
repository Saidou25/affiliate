import React, { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import "./index.css";

const REGISTER_AFFILIATE = gql`
  mutation RegisterAffiliate(
    $name: String!,
    $email: String!,
    $refId: String!,
    $totalClicks: Int!,
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

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [refId, setRefId] = useState("");
  const [totalClicks,setTotalClicks] = useState("");
  const [totalCommissions, setTotalCommissions] = useState("");

  const { data, loading, error } = useQuery(GET_AFFILIATES);
console.log(data);
  const [registerAffiliate] = useMutation(REGISTER_AFFILIATE, {
    onCompleted: (data) => {
      console.log("User created:", data.registerAffiliate);
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerAffiliate({ variables: { name, email, refId, totalClicks: +totalClicks, totalCommissions: +totalCommissions } });
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
            <strong>{affiliate.name}</strong> - {affiliate.email} - {affiliate.refId} - {affiliate.totalClicks} - {affiliate.totalCommissions}
          </div>
        ))}
    </div>
  );
}

export default App;
