import AffiliateInfo from "./AffiliateInfo";
import { RiLogoutCircleRLine } from "react-icons/ri";
import AuthService from "../utils/auth";
import Admin from "./Admin";

import "./Dashboard.css";

interface Props {
  data: string;
}
export default function Dashboard({ data }: Props) {
  const handleLogout: React.MouseEventHandler<SVGElement> = () => {
    AuthService.logout();
  };

  return (
    <div style={{ padding: "5%" }}>
      <div className="log-out">
        <RiLogoutCircleRLine className="iomdlogout" onClick={handleLogout} />
      </div>
      {data === "admin" ? <Admin /> : <AffiliateInfo />}
    </div>
  );
}
