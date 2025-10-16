import { useState, useRef, useEffect, useMemo } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Affiliate } from "../types";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { useNotifications } from "../hooks/useNotifications";
import { sortNotifications } from "../utils/sortedNotification";

import "./NotificationMenu.css";

type Props = {
  me?: Affiliate;
  onboardingStatus: AffiliateOutletContext["onboardingStatus"];
};

export default function NotificationMenu({ me, onboardingStatus }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount } = useNotifications(me);

  const sorted = useMemo(
    () => sortNotifications(notifications),
    [notifications]
  );

  const handleClick = async () => {
    setOpen(false);
    navigate("/affiliate/notifications", { state: { notifications } });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", {
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

  if (onboardingStatus?.loading) return null;

  return (
    <div className="notification-container" ref={menuRef}>
      <button
        className="notification-button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Notifications${
          unreadCount ? ` (${unreadCount} unread)` : ""
        }`}
      >
        <IoNotificationsOutline className="bell-icon" />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>

      {open && (
        <div
          className="notification-dropdown"
          role="menu"
          aria-label="Notifications"
        >
          <div className="dropdown-header p-3">Notifications</div>
          <ul className="notification-list">
            {sorted?.map((n: any, i: number) => {
              const isUnread = n?.read === false || n?.read === "false";
              const ts = n?.date ?? n?.createdAt;
              return (
                <li
                  key={n?.id ?? n?._id ?? `${n?.title ?? "n"}-${i}`}
                  className={`notification-item ${isUnread ? "unread" : ""}`}
                >
                  {/* per-item dot for unread */}
                  {isUnread && (
                    <span className="notif-item-dot" aria-hidden="true" />
                  )}

                  <div className="text-wrap">
                    <div className="message">{n?.text ?? n?.title}</div>
                    <div className="time">{ts ? formatDate(ts) : ""}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="dropdown-footer">
            <button onClick={handleClick}>View all</button>
          </div>
        </div>
      )}
    </div>
  );
}
