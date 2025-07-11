import { useState, useRef, useEffect } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

import "./NotificationMenu.css";
import { useNavigate } from "react-router-dom";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery(QUERY_ME);
  const notifications = data?.me?.notifications ?? [];

  const navigate = useNavigate();
  // const notifications = [
  //   { id: 1, message: "New affiliate sale recorded", time: "2 min ago" },
  //   { id: 2, message: "Commission payment sent", time: "1 hr ago" },
  //   { id: 3, message: "System update available", time: "Yesterday" },
  // ];
const unreadCount = notifications?.filter((n: any) => !n.read).length;

  const handleClick = () => {
    navigate("notifications ", { state: { openedFromMenu: true } });
  };
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notification-container" ref={menuRef}>
      <button className="notification-button" onClick={() => setOpen(!open)}>
        <IoNotificationsOutline className="bell-icon" />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="dropdown-header">Notifications</div>
          <ul className="notification-list">
            {notifications?.map((n: any, index: number) => (
              <li key={index} className="notification-item">
                <div className="message">{n.text}</div>
                <div className="time">{n.date}</div>
              </li>
            ))}
          </ul>
          <div className="dropdown-footer">
            <button onClick={handleClick}>View all</button>
          </div>
        </div>
      )}
    </div>
  );
}
