import { Link, NavLink } from "react-router-dom";
import AuthService from "../utils/auth";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";
import { affiliateLinks, adminLinks } from "../data/navData";
import NotificationMenu from "./NotificationMenu";
import ProfileMenu from "./ProfileMenu";
import Header from "./Header";

import "./Navbar.css";

export default function Navbar() {
  const [links, setLinks] = useState<string[]>([]);
  const [group, setGroup] = useState("");

  const isLoggedIn = AuthService.loggedIn();

  const handleLogout: React.MouseEventHandler<SVGElement> = () => {
    AuthService.logout();
  };
  const { data } = useQuery(QUERY_ME);
  const me = data?.me;

  useEffect(() => {
    if (me?.role === "affiliate") {
      setGroup(affiliateLinks.group);
      setLinks(affiliateLinks.links);
    } else {
      setGroup(adminLinks.group);
      setLinks(adminLinks.links);
    }
  }, [me]);

  return (
    <div className="navigation-height">
      {isLoggedIn && (
        <>
          <div className="top-nav-div">
            <Link className="logo-nav" to="/">
              <img
                className="img-fluid"
                src="https://assets.zyrosite.com/mP47Mwo0WQhVBkl5/pgp-logo-favicon-2025-mnlvrQoloKTvJvO7.png"
                alt="pg logo"
              />
            </Link>
            <div className="top-navbar">
              {me?.role !== "admin" && (
                <>
                  <ProfileMenu />
                  <NotificationMenu />
                </>
              )}
              <RiLogoutCircleRLine
                className="iomdlogout-nav"
                onClick={handleLogout}
              />
            </div>
          </div>

          <div className="navigation-bar-container bg-dark">
            <nav className="navbar">
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
            </nav>
          </div>
        </>
      )}
      <Header isLoggedIn={isLoggedIn} />
    </div>
  );
}
