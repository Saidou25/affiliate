import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useMutation, useQuery } from "@apollo/client";
import { REGISTER_AFFILIATE } from "../utils/mutations";
import { AiOutlineClose } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { LOGIN } from "../utils/mutations";
import AuthService from "../utils/auth";
import { QUERY_ME } from "../utils/queries";

import "./RegisterForm.css";
import Button from "./Button";

export default function RegisterForm() {
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [buttonEnabled, setButtonEnabled] = useState(false);
  // const [totalClicks, setTotalClicks] = useState("");
  // const [totalCommissions, setTotalCommissions] = useState("");
  const isLoggedIn = AuthService.loggedIn();
  const navigate = useNavigate();

  const { refetch } = useQuery(QUERY_ME, {
    skip: !isLoggedIn, // only run if logged in
  });

  const [login] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      localStorage.setItem("token", login.token);
      refetch().then((res) => {
        const role = res.data?.me?.role;
        if (role === "admin") navigate("/admin");
        else if (role === "affiliate") navigate("/affiliate");
      });
    },
    onError: (error) => {
      console.error("Login error:", error.message);
    },
  });

  const [registerAffiliate, { loading, error }] = useMutation(
    REGISTER_AFFILIATE,
    {
      onCompleted: () => {
        login({
          variables: {
            email: formState.email,
            password: formState.password,
          },
        });
      },
      onError: (error) => {
        console.error("Error creating user:", error.message);
      },
    }
  );

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
        <Link style={{ display: "flex", justifyContent: "flex-end" }} to="/">
          <AiOutlineClose
            // onClick={() => closeForm(false)}
            style={{ width: "5%", height: "auto" }}
          />
        </Link>
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
        <Button
          type="submit"
          disabled={!buttonEnabled || loading}
          className="blue-btn"
        >
          Submit
        </Button>
        <br />
        {error && <p style={{ color: "red" }}>{error.message}</p>}
        <br />
      </form>
    </div>
  );
}
