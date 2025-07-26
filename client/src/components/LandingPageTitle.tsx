import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import "./LandingPageTitle.css";

type Props = {
  isLoggedIn?: boolean;
};
export default function LandingPageTitle({ isLoggedIn }: Props) {
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
    <div className="title-container">
      <div className="text-spans">
        <span className="princeton">princeton</span>
        <span className="green">green</span>
      </div>{" "}
      <br />
      <span className="affiliate-programm">
        {isLoggedIn ? (
          <h2 className="text-secondary">{headerText}</h2>
        ) : (
          <span>Join Our Affiliate Program and Start Earning Commissions</span>
        )}
      </span>
    </div>
  );
}
