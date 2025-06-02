import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { LOGIN } from "../utils/mutations";
import { AiOutlineClose } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { QUERY_ME } from "../utils/queries";
import AuthService from "../utils/auth";
//
export default function AffiliateLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const isLoggedIn = AuthService.loggedIn();

  const { data, refetch } = useQuery(QUERY_ME, {
    skip: !isLoggedIn, // only run if logged in
  });
  const me = data?.me || {};

  const [login, { loading, error }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      localStorage.setItem("token", login.token);
      refetch(); // refetch user data
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ variables: { email: form.email, password: form.password } });
  };

  useEffect(() => {
    if (me?.role) {
      if (me.role === "admin") navigate("/admin");
      else if (me.role === "affiliate") navigate("/affiliate");
    }
  }, [me, navigate]);

  return (
    <div className="login-container">
      <h2>Log in to your account</h2>
      <form className="form-container" onSubmit={handleSubmit}>
        <Link style={{ display: "flex", justifyContent: "flex-end" }} to="/">
          <AiOutlineClose
            // onClick={() => closeForm(false)}

            style={{ width: "5%", height: "auto" }}
          />
        </Link>
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
