import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { LOGIN } from "../utils/mutations";
import { AiOutlineClose } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { QUERY_ME } from "../utils/queries";
import AuthService from "../utils/auth";
import Button from "./Button";
import Banner, { BannerVariant } from "./Banner";

export default function AffiliateLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const isLoggedIn = AuthService.loggedIn();

  const { data, refetch } = useQuery(QUERY_ME, {
    skip: !isLoggedIn, // only run if logged in
  });
  const me = data?.me || {};

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: ({ login }) => {
      localStorage.setItem("token", login.token);
      refetch(); // refetch user data
    },
  });

  const bannerVariant: BannerVariant | undefined = bannerMessage
    ? /fail/i.test(bannerMessage)
      ? "error"
      : /success/i.test(bannerMessage)
      ? "success"
      : undefined
    : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBannerMessage(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedIn = await login({
        variables: { email: form.email, password: form.password },
      });
      if (loggedIn) {
        setBannerMessage("Successfully logged in.");
      }
    } catch (err) {
      setBannerMessage("Failed loging.");
    }
  };

  useEffect(() => {
    if (me?.role && !bannerMessage) {
      if (me.role === "admin") {
        navigate("/admin/affiliates");
        window.scrollTo(0, 0);
      } else if (me.role === "affiliate") {
        navigate("/affiliate/products");
        window.scrollTo(0, 0);
      }
    }
  }, [me, navigate, bannerMessage]);

  // Auto-hide success after 4s (optional)
  useEffect(() => {
    if (!bannerMessage || bannerMessage.includes("failed")) return;
    const t = setTimeout(() => setBannerMessage(null), 2000);
    return () => clearTimeout(t);
  }, [bannerMessage]);

  return (
    <div className="login-container">
      {/* <h2>Log in to your account</h2> */}
      <form className="form-container" onSubmit={handleSubmit}>
        {bannerVariant && (
          <Banner
            variant={bannerVariant}
            title={bannerVariant === "error" ? "Login failed" : "Logged in"}
            message={bannerMessage ?? ""}
            dismissible
            onClose={() => setBannerMessage(null)}
            className="mb-3 "
            ariaLive={bannerVariant === "error" ? "assertive" : "polite"}
            role={bannerVariant === "error" ? "alert" : "status"}
          />
        )}

        <Link style={{ display: "flex", justifyContent: "flex-end" }} to="/">
          <AiOutlineClose
            // onClick={() => closeForm(false)}

            style={{ width: "5%", height: "auto" }}
          />
        </Link>
        <h1 className="title">Sign in to your account</h1>
        <label htmlFor="email">Email</label>
        <br />
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="username"
          placeholder="email@example.com"
          style={{ padding: "1%", fontStyle: "italic" }}
        />
        <br />
        <br />
        <label htmlFor="password">Password</label>
        <br />
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="password"
          style={{ padding: "1%", fontStyle: "italic" }}
          autoComplete="current-password"
        />
        <br />
        <br />
        <Button type="submit" disabled={loading} className="blue-btn">
          {loading ? "Logging in…" : "Log In"}
        </Button>
        {/* {error && <p style={{ color: "red" }}>{error.message}</p>} */}
      </form>
    </div>
  );
}
