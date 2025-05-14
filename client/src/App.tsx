import { useState } from "react";
import RegisterForm from "./components/RegisterForm";
import AffiliateLogin from "./components/AffiliateLogin";

import "./index.css";
import Dashboard from "./components/Dashboard";


function App() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
console.log(showDashboard);

  if (showRegistration) {
    return <RegisterForm closeForm={setShowRegistration} />;
  }
  if (showLogin) {
    return <AffiliateLogin closeForm={setShowLogin} dashboardReady={setShowDashboard} />;
  }
  if (showDashboard) {
    return <Dashboard />;
  }
  return (
    <div className="but-container"
    style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "30%"}}>
      <button className="" onClick={() => {setShowRegistration(true)}}
        style={{ padding: "1%", borderRadius: "10px", width: "20%", margin: "5px" }}>Register</button>
      <button className="" onClick={() => {setShowLogin(true)}}
        style={{ padding: "1%", borderRadius: "10px", width: "20%", margin: "5px" }}>Login</button>
    </div>
  )
}

export default App;
