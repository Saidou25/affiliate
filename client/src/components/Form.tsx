import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useMutation } from "@apollo/client";
import { REGISTER_AFFILIATE } from "../utils/mutations";

import "./Form.css";

export default function Form() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  // const [totalClicks, setTotalClicks] = useState("");
  // const [totalCommissions, setTotalCommissions] = useState("");
  const dynamicReferralCode = nanoid(8);

  const [registerAffiliate] = useMutation(REGISTER_AFFILIATE, {
    onCompleted: (data) => {
      console.log("User created:", data.registerAffiliate);
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState({ ...formState, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerAffiliate({
      variables: {
        name: formState.name,
        email: formState.email,
        refId: dynamicReferralCode,
        // totalClicks: +totalClicks,
        // totalCommissions: +totalCommissions,
      },
    });
  };

  useEffect(() => {
    if (formState.email && formState.name) {
      setButtonEnabled(true);
    } else {
      setButtonEnabled(false);
    }
  }, [formState]);

  return (
    <div className="">
      <h2>Creating your Affiliate account</h2>
      <form className="form-container" onSubmit={handleSubmit}>
        <h1 className="title">Register Affiliate</h1>
        <label className="" htmlFor="name">
          Name
        </label>
        <br />
        <input
          id="name"
          className="input"
          type="text"
          name="name"
          value={formState.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <br />
        <label className="" htmlFor="email">
          Email
        </label>
        <br />
        <input
          id="email"
          className="input"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <br />
        <br />
        <button type="submit" disabled={!buttonEnabled}>
          Submit
        </button>
        <br />
      </form>
    </div>
  );
}
