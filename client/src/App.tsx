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
const GET_REFERRALS = gql`
  query GetReferrals {
    getReferrals {
      # id
      event
      email
      refId
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

interface Referral {
  refId: String;
  email: String;
  event: String;
}

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [totalClicks, setTotalClicks] = useState("");
  const [totalCommissions, setTotalCommissions] = useState("");
  const [refLink, setRefLink] = useState("");

  const referralCode = useReferralCode();
  // console.log("reference code: ", referralCode);

  const { data, loading, error } = useQuery<{ getAffiliates: Affiliate[] }>(
    GET_AFFILIATES
  );
  const { data: referralsData, loading: loadingReferrals, error: errorReferrals } = useQuery<{ getReferrals: Referral[] }>(
    GET_REFERRALS
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
  // const link = `https://princetongreen.org/a-free-55-day-journey-to-unleash-your-power-from-within/?ref=${referralCode}`;

  const deleteAffiliate = (refId: string) => {
    // console.log(data);
    console.log(referralCode);
    console.log(refId);
    if (refId === referralCode) {
      // const affiliate = data.getAffiliates.filter(
      //   (d: Affiliate) => d.refId === referralCode
      // );
      // console.log(affiliate[0].name);
      console.log("yes: ", refId);
    setRefLink(`https://princetongreen.org/a-free-55-day-journey-to-unleash-your-power-from-within/?ref=${referralCode}`)
    } else {
      console.log("not the one: ", referralCode);
    }
  };

  // console.log(link);

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
        <br />
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <br />
        <br />
        <input
          type="number"
          value={totalClicks}
          onChange={(e) => setTotalClicks(e.target.value)}
          placeholder="total clicks"
        /><br />
          <br />
        <input
          type="number"
          value={totalCommissions}
          onChange={(e) => setTotalCommissions(e.target.value)}
          placeholder="total comission"
        />
        <br /><br />
        <br />
        <button type="submit">Create User</button><br />
      </form>
      <h2>All Users</h2>
      <strong style={{ color: "white" }}>
      
      </strong>
      {loading && <p>Loading users...</p>}
      {error && <p>Error fetching users: {error.message}</p>}
      {data &&
        data.getAffiliates.map((affiliate: any) => (
          <div key={affiliate.id}>
            <strong>{affiliate.name}</strong> - {affiliate.email} -{" "}
            {affiliate.refId} - {affiliate.totalClicks} -{" "}
            {affiliate.totalCommissions}
            <button onClick={() => deleteAffiliate(affiliate.refId)}>
             remove
            </button>
            <br />
            {affiliate.refId === referralCode && <>{refLink}</>}
          </div>
        ))}
         <h2>All tracked Referrals</h2>
      <strong style={{ color: "white" }}>
      
      </strong>
      {loadingReferrals && <p>Loading referrals...</p>}
      {errorReferrals && <p>Error fetching referrals: {errorReferrals.message}</p>}
      {referralsData &&
        referralsData.getReferrals.map((referral: any) => (
          <div key={referral.refId}>
            <strong>{referral.event}</strong> - {referral.email} -{" "}
            {referral.refId} 
            <button onClick={() => deleteAffiliate(referral.refId)}>
             remove
            </button>
            <br />
            {referral.refId === referralCode && <>{refLink}</>}
          </div>
        ))}
    </div>
  );
}

export default App;
