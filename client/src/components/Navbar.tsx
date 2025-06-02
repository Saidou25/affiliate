import { NavLink } from "react-router-dom";
import AuthService from "../utils/auth";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";
import { affiliateLinks, adminLinks } from "../data/navData";

import "./Navbar.css";

export default function Navbar() {
  const [links, setLinks] = useState<string[]>([]);
  const [group, setGroup] = useState("");
  const handleLogout: React.MouseEventHandler<SVGElement> = () => {
    AuthService.logout();
  };
  const { data } = useQuery(QUERY_ME);

  useEffect(() => {
    const me = data?.me;
    if (me?.role === "affiliate") {
      setGroup(affiliateLinks.group);
      setLinks(affiliateLinks.links);
    } else {
      setGroup(adminLinks.group);
      setLinks(adminLinks.links);
    }
  }, [data]);

  return (
    <nav
      className="navbar"
      style={{ display: "flex", justifyContent: "flex-end" }}
    >
      {links &&
        links.map((link, index) => (
          <NavLink
            key={index}
            to={`/${group}/${link.toLowerCase()}`}
            // className={({ isActive }) => (isActive ? "active" : "")}
          >
            {link}
          </NavLink>
        ))}
      <div className="log-out">
        <RiLogoutCircleRLine className="iomdlogout" onClick={handleLogout} />
      </div>
    </nav>
  );
}
