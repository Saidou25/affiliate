import { useState } from "react";
import AuthService from "./utils/auth";
import RegisterForm from "./components/RegisterForm";
import AffiliateLogin from "./components/AffiliateLogin";
import Dashboard from "./components/Dashboard";

import "./index.css";

function App() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const isLoggedIn = AuthService.loggedIn();

  if (showRegistration) {
    return <RegisterForm closeForm={setShowRegistration} />;
  }
  if (showLogin) {
    return <AffiliateLogin closeForm={setShowLogin} />;
  }
  if (isLoggedIn) {
    return <Dashboard />;
  }
  return (
    <div
      className="but-container"
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginTop: "30%",
      }}
    >
      <button
        className=""
        onClick={() => {
          setShowRegistration(true);
        }}
        style={{
          padding: "1%",
          borderRadius: "10px",
          width: "20%",
          margin: "5px",
        }}
      >
        Register
      </button>
      <button
        className=""
        onClick={() => {
          setShowLogin(true);
        }}
        style={{
          padding: "1%",
          borderRadius: "10px",
          width: "20%",
          margin: "5px",
        }}
      >
        Login
      </button>
    </div>
  );
}

export default App;
