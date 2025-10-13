import { format } from "date-fns";
import { Notification } from "../types";
import useSortNotifications from "../hooks/useSortNotifications";
import { useNotifications } from "../hooks/useNotifications";
import { useOutletContext } from "react-router-dom";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { IoMdNotificationsOff } from "react-icons/io";

import "./NotificationsList.css";

export default function NotificationsList() {
  const { me } = useOutletContext<AffiliateOutletContext>();
  const { notifications, loading } = useSortNotifications();

  const { markNotificationRead } = useNotifications(me);

  if (loading) {
    return (
      <div className="notifications-page" aria-busy="true" aria-live="polite">
        <h2>All Notifications</h2>
        <ul className="notifications-list" aria-hidden="true">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="notification-entry">
              <div className="skeleton skeleton-date" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text short" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!notifications?.length) {
    return (
         <div className="empty-state">
           <IoMdNotificationsOff  size={64} className="opacity-60" aria-hidden />
           <h3>No Notifications Found</h3>
         </div>
       );
  }

  return (
    <div className="notifications-page">
      <h2>All Notifications</h2>
      <br />
      {notifications?.length === 0 ? (
        <p>No notifications found.</p>
      ) : (
        <ul className="notifications-list">
          {notifications?.map((note: Notification, index: number) => (
            <li
              key={String(note?.id ?? note?.id ?? index)}
              className="row g-0 notification-entry"
              style={{ justifyContent: "space-between" }}
            >
              <div className="col-md-9">
                <div className="notification-date">
                  {format(new Date(note.date), "MMM dd, yyyy HH:mm")}
                </div>
                <div className="notification-title">{note.title}</div>
                <div className="notification-text">{note.text}</div>
              </div>
              <div className="col-md-2 button-marked-div">
                {note?.read === false && (
                  <button
                    className="marked-red"
                    type="button"
                    onClick={() => markNotificationRead(note.id)}
                  >
                    mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
