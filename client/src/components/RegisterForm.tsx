import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useMutation } from "@apollo/client";
import { REGISTER_AFFILIATE } from "../utils/mutations";
import { AiOutlineClose } from "react-icons/ai";

import "./RegisterForm.css";

interface Props {
  closeForm: (item: boolean) => void;
}

export default function RegisterForm({ closeForm }: Props) {
  const [formState, setFormState] = useState({
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
      console.error("Error creating user:", error.message, data);
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
         <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <AiOutlineClose onClick={() => closeForm(false)} 
            style={{ width: "5%", height: "auto" }}/>
        </div>
        <h1 className="title">Register Affiliate</h1>
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
          placeholder="email@example.com"
            style={{ padding: "1%", fontStyle: "italic" }}
        />
        <br />
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
            style={{ padding: "1%", fontStyle: "italic" }}
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
