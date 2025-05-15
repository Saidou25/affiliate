import { useMutation } from "@apollo/client";
import { LOG_CLICK } from "../utils/mutations";
import { useEffect } from "react";
import Products from "./Products";
import AffiliateInfo from "./AffiliateInfo";
import { RiLogoutCircleRLine } from "react-icons/ri";
import AuthService from "../utils/auth";
import ReferralsList from "./ReferralsList";
import AffiliatesList from "./AffiliatesList";

import "./Dashboard.css";

export default function Dashboard() {
 
  const [logClick] = useMutation(LOG_CLICK);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("ref");

    if (refId) {
      logClick({ variables: { refId } });
    }
  }, []);

  const handleLogout: React.MouseEventHandler<SVGElement> = () => {
    AuthService.logout();
  };

  return (
    <div style={{ padding: "5%" }}>
      <div className="log-out">
        <RiLogoutCircleRLine className="iomdlogout" onClick={handleLogout} />
      </div>
      <AffiliatesList />
      <ReferralsList />
      <AffiliateInfo />
      <Products />
    </div>
  );
}
