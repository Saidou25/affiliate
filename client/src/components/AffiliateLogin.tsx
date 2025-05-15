import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../utils/mutations";
import { AiOutlineClose } from "react-icons/ai";

interface Props {
  closeForm: (item: boolean) => void;
  dashboardReady: (item: boolean) => void;
}
export default function AffiliateLogin({ closeForm, dashboardReady }: Props) {
  const [form, setForm] = useState({ email: "", password: "" });

  const [login, { loading, error }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      // 1) Store the JWT so ApolloClient will pick it up
      localStorage.setItem("token", login.token);
      // 2) Redirect to the affiliate dashboard (or wherever)
      // console.log("you are logged in: ", login.token);
      closeForm(false);
      dashboardReady(true);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ variables: { email: form.email, password: form.password } });
  };

  return (
    <div className="login-container">
      <h2>Log in to your account</h2>
      <form className="form-container" onSubmit={handleSubmit}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <AiOutlineClose onClick={() => closeForm(false)} 
            style={{ width: "5%", height: "auto" }}/>
        </div>
        <h1 className="title">Login</h1>
        <label htmlFor="email1">Email</label>
        <br />
        <input
          id="email1"
          name="email"
          type="email1"
          value={form.email}
          onChange={handleChange}
          required
            placeholder="email@example.com"
           style={{ padding: "1%", fontStyle: "italic" }}
        />
        <br />
        <br />
        <label htmlFor="password1">Password</label>
        <br />
        <input
          id="password1"
          name="password"
          type="password1"
          value={form.password}
          onChange={handleChange}
          required
            placeholder="password"
           style={{ padding: "1%", fontStyle: "italic" }}
        />
        <br />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </button>
        {error && <p style={{ color: "red" }}>{error.message}</p>}
      </form>
    </div>
  );
}
