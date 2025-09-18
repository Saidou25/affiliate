import { useMutation, useQuery } from "@apollo/client";
import { format } from "date-fns";
import { QUERY_ME } from "../utils/queries";
import { MARK_NOTIFICATIONS_READ } from "../utils/mutations";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Notification } from "../types";

import "./NotificationsList.css";

export default function NotificationsList() {
  const location = useLocation();
  const openedFromMenu = location.state?.openedFromMenu;

  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ);

  const { data, loading, error } = useQuery(QUERY_ME, {
    fetchPolicy: "network-only",
  });

  const notifications: Notification[] = [
    ...(data?.me?.notifications ?? []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    if (openedFromMenu && data?.me?.refId) {
      markRead({ variables: { refId: data?.me.refId } });
    }
  }, [openedFromMenu, data, markRead]);

  if (loading) return <p>Loading notifications...</p>;
  if (error) return <p>Error loading notifications.</p>;

  return (
    <div className="notifications-page">
      <h2>All Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="notifications-list">
          {notifications.map((note: Notification, index: number) => (
            <li key={index} className="notification-entry">
              <div className="notification-date">
                {format(new Date(note.date), "MMM dd, yyyy HH:mm")}
              </div>
              <div className="notification-title">{note.title}</div>
              <div className="notification-text">{note.text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
