import { useState, useRef, useEffect, useMemo } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { UPDATE_NOTIFICATION_READ_STATUS } from "../utils/mutations";
import { useNavigate } from "react-router-dom";
import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";

import "./NotificationMenu.css";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Creates notifications when appropriate (your custom hook)
  useOnBoardingNotifications();

  const { data, loading } = useQuery(QUERY_ME);
  const meRefId = data?.me?.refId;

  const [updateNotificationReadStatus] = useMutation(
    UPDATE_NOTIFICATION_READ_STATUS,
    { refetchQueries: [{ query: QUERY_ME }] }
  );

  const notifications = useMemo(() => {
    const list = data?.me?.notifications ?? [];
    return [...list].sort(
      (a: any, b: any) =>
        new Date(b?.date ?? b?.createdAt).getTime() -
        new Date(a?.date ?? a?.createdAt).getTime()
    );
  }, [data?.me?.notifications]);

  const unread = useMemo(
    () =>
      (notifications ?? []).filter(
        (n: any) => n?.read === false || n?.read === "false"
      ),
    [notifications]
  );

  const unreadCount = unread.length;

  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      if (meRefId && unread.length) {
        await Promise.all(
          unread.map((n: any) =>
            updateNotificationReadStatus({
              variables: { refId: meRefId, title: n.title, read: true },
            })
          )
        );
      }
    } catch (e) {
      console.error("Failed to mark notifications as read:", e);
    } finally {
      setOpen(false);
      navigate("/affiliate/notifications", { state: { openedFromMenu: true } });
    }
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

  if (loading) return null;

  return (
    <div className="notification-container" ref={menuRef}>
      <button
        className="notification-button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <IoNotificationsOutline className="bell-icon" />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu" aria-label="Notifications">
          <div className="dropdown-header p-3">Notifications</div>
          <ul className="notification-list">
            {notifications?.map((n: any, i: number) => {
              const isUnread = n?.read === false || n?.read === "false";
              const ts = n?.date ?? n?.createdAt;
              return (
                <li
                  key={n?.id ?? n?._id ?? `${n?.title ?? "n"}-${i}`}
                  className={`notification-item ${isUnread ? "unread" : ""}`}
                >
                  <div className="text-wrap">
                    <div className="message">{n?.text}</div>
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
