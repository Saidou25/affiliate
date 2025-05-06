import { useState } from "react";
import { nanoid } from "nanoid";
import { useMutation } from "@apollo/client";
import { REGISTER_AFFILIATE } from "../utils/mutations";

export default function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [totalClicks, setTotalClicks] = useState("");
  const [totalCommissions, setTotalCommissions] = useState("");
  const dynamicReferralCode = nanoid(8);

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
        />
        <br />
        <br />
        <input
          type="number"
          value={totalCommissions}
          onChange={(e) => setTotalCommissions(e.target.value)}
          placeholder="total comission"
        />
        <br />
        <br />
        <br />
        <button type="submit">Create User</button>
        <br />
      </form>
    </div>
  );
}
