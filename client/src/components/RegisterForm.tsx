import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useMutation } from "@apollo/client";
import { REGISTER_AFFILIATE } from "../utils/mutations";

import "./RegisterForm.css";

export default function RegisterForm() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  // const [totalClicks, setTotalClicks] = useState("");
  // const [totalCommissions, setTotalCommissions] = useState("");
 

  const [registerAffiliate, { loading, error, data }] = useMutation(REGISTER_AFFILIATE, {
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
        refId: nanoid(8),
        password: formState.password,
        // totalClicks: +totalClicks,
        // totalCommissions: +totalCommissions,
      },
    });
  };

  useEffect(() => {
    if (formState.email && formState.password) {
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
        {/* <label className="" htmlFor="name">
          Name
        </label>
        <br />
        <input
          id="name"
          type="text"
          name="name"
          value={formState.name}
          onChange={handleChange}
          placeholder="Name"
        />
        <br /> */}
        <label className="" htmlFor="email">
          Email
        </label>
        <br />
        <input
          id="email"
          type="email"
          name="email"
          value={formState.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <label className="" htmlFor="password">
          Password
        </label>
        <br />
        <input
          id="password"
          type="password"
          name="password"
          value={formState.password}
          onChange={handleChange}
          placeholder="password"
        />
        <br />
        <br />
        <button type="submit" disabled={!buttonEnabled || loading}>
          Submit
        </button>
        <br />
        {error && <p style={{ color: "red" }}>{error.message}</p>}
        <br />
      </form>
    </div>
  );
}
