import { useState, useRef, useEffect } from "react";
import {
  IoPersonCircleOutline,
  IoSettingsOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AuthService from "../utils/auth";

import "./ProfileMenu.css";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleLogout: React.MouseEventHandler<HTMLSpanElement> = () => {
    AuthService.logout();
  };

  const menuItems = [
    { id: 1, label: "View profile", route: "profile", icon: <FaUserCircle /> },
    {
      id: 2,
      label: "Settings",
      route: "settings",
      icon: <IoSettingsOutline />,
    },
    { id: 3, label: "Log out", icon: <IoLogOutOutline /> },
  ];

  const handleNavigate = (route: string) => {
    navigate(`${route}`);
    document.removeEventListener("mousedown", handleClickOutside);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notification-container" ref={menuRef}>
      <button className="notification-button" onClick={() => setOpen(!open)}>
        <IoPersonCircleOutline className="person-nav" />
      </button>

      {open && (
        <div className="notification-dropdown">
          <ul className="notification-list">
            {menuItems.map((item) => (
              <li key={item.id} className="notification-item">
                <span className="menu-icon">{item.icon}</span>
                <span
                  className="menu-label"
                  onClick={
                    item.label === "Log out"
                      ? handleLogout
                      : () => item.route && handleNavigate(item.route)
                  }
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
