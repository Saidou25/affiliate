import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import "./Header.css";

type Props = { isLoggedIn?: boolean };

export default function Header({ isLoggedIn }: Props) {
  const location = useLocation();

  const headerText = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean).pop() ?? "";
    if (!seg) return ""; // homepage
    // make it pretty: decode, replace dashes/underscores, Title Case
    const pretty = decodeURIComponent(seg)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return pretty;
  }, [location.pathname]);

  return (
    <header className={isLoggedIn ? "header-container" : "header-not-loggedIn"}>
      <div className="text-spans">
        <span className="princeton">princeton</span>
        <span className="green">green</span>
      </div>

      <h2 className={headerText ? "text-secondary" : "text-white"}>
        {headerText || "Join Our Affiliate Program and Start Earning Commissions"}
      </h2>
    </header>
  );
}
