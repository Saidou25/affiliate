import { useState, useRef, useEffect } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useMutation, useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useNavigate } from "react-router-dom";

import "./NotificationMenu.css";
import {
  CREATE_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS,
} from "../utils/mutations";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);

  // useRef guard ensures the logic runs once. 
  // useRef lets us track whether we've already run something, without re-triggering the component update cycle.
  const hasHandledNotification = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [createNotification] = useMutation(CREATE_NOTIFICATION);
  const [updateNotificationReadStatus] = useMutation(
    UPDATE_NOTIFICATION_READ_STATUS
  );

  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};
  const notifications = data?.me?.notifications ?? [];

  console.log("me: ", me);

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

  const createNewNotification = async (title: string, text: string) => {
    try {
      const { data } = await createNotification({
        variables: {
          refId: me.refId,
          title,
          text,
          read: false,
        },
      });
      if (data) {
        console.log(
          "success creating notification on affiliate's payment status!"
        );
      }
    } catch (error) {
      console.log("Something went wrong", error);
    }
  };

  const updateNotificationStatus = async (title: string) => {
    try {
      const { data } = await updateNotificationReadStatus({
        variables: {
          refId: me.refId,
          title,
          read: false,
        },
      });
      if (data) {
        console.log(
          "success creating notification on affiliate's payment status!"
        );
      }
    } catch (error) {
      console.log("Something went wrong", error);
    }
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

  // ✅ Trigger notification if Stripe is not setup
  useEffect(() => {
    if (hasHandledNotification.current) return;
    if (!me?.refId || notifications.length === 0) return;
    const paymentNotification = notifications.find(
      (n: any) => n.title === "Payment setup"
    );

    if (me?.refId && !me.stripeAccountId) {
      if (!paymentNotification) {
        // Create the notification for the first time
        const title = "Payment setup";
        const text =
          "Don't forget to setup your payment so you are able to receive your commissions";
        createNewNotification(title, text);
      } else if (paymentNotification.read) {
        const title = "Payment setup";
        // If it was marked as read, make it unread again
        updateNotificationStatus(title);
      }
    }
    hasHandledNotification.current = true;
  }, [me?.refId, me?.stripeAccountId, notifications]);

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
