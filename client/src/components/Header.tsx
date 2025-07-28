import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import "./Header.css";

type Props = {
  isLoggedIn?: boolean;
};
export default function Header({ isLoggedIn }: Props) {
  const [headerText, setHeaderText] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname) {
      const lastSegment =
        location.pathname.split("/").filter(Boolean).pop() ?? "";
      setHeaderText(lastSegment);
    }
  }, [location.pathname]);

  return (
    <div
      className={
        isLoggedIn ? "header-container bg-dark" : "header-not-loggedIn bg-dark"
      }
    >
      <div className="text-spans">
        <span className="princeton">princeton</span>
        <span className="green">green</span>
      </div>
      <br />
      <span className="affiliate-programm">
        {headerText !== "" ? (
          <h2 className="text-secondary">{headerText}</h2>
        ) : (
          <h2 className="text-white">
            Join Our Affiliate Program and Start Earning Commissions
          </h2>
        )}
      </span>
    </div>
  );
}
