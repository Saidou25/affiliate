import { useState, useRef, useEffect } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useNavigate } from "react-router-dom";
import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";

import "./NotificationMenu.css";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useOnBoardingNotifications();

  const { data, loading } = useQuery(QUERY_ME);
  // This avoids rendering before data is available.
  if (loading) return null;
  const notifications = [...(data?.me?.notifications ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const navigate = useNavigate();

  const unreadCount = notifications?.filter((n: any) => !n.read).length;

  const handleClick = () => {
    setOpen(false);
    navigate("notifications ", { state: { openedFromMenu: true } });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
          <div className="dropdown-header p-3">Notifications</div>
          <ul className="notification-list">
            {notifications?.map((n: any, index: number) => (
              <li key={index} className="notification-item">
                <div className="message">{n.text}</div>
                <div className="time">{formatDate(n.date)}</div>
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
