import AffiliateInfo from "./AffiliateInfo";
import { RiLogoutCircleRLine } from "react-icons/ri";
import AuthService from "../utils/auth";
import Admin from "./Admin";

import "./Dashboard.css";

export default function Dashboard() {
 
  const handleLogout: React.MouseEventHandler<SVGElement> = () => {
    AuthService.logout();
  };

  return (
    <div style={{ padding: "5%" }}>
      <div className="log-out">
        <RiLogoutCircleRLine className="iomdlogout" onClick={handleLogout} />
      </div>
      <Admin />
      <AffiliateInfo />
    </div>
  );
}
