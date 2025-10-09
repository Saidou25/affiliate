// components/NotificationMenu.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useMutation } from "@apollo/client";
import { MARK_ALL_NOTIFICATIONS_READ } from "../utils/mutations";
import { useNavigate } from "react-router-dom";
import { Affiliate } from "../types";
import { AffiliateOutletContext } from "./AffiliateDashboard";
// import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";
import { QUERY_ME } from "../utils/queries";

import "./NotificationMenu.css";
// import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";

type MeResult = {
  me?: {
    notifications?: Array<Record<string, any> & { read?: boolean }>;
    // ...other me fields are fine to keep as-is
  };
};

type Props = {
  me?: Affiliate;
  onboardingStatus: AffiliateOutletContext["onboardingStatus"];
};

export default function NotificationMenu({ me, onboardingStatus }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get all notifications (hook also manages onboarding side-effects)
  // const notifications = useOnBoardingNotifications(me, onboardingStatus);

  // Mark ALL read on “View all”
const [markAllNotificationsRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
  update(cache) {
    // If QUERY_ME uses variables, include them in both calls
    const prev = cache.readQuery<MeResult>({ query: QUERY_ME });
    const currentMe = prev?.me;
    if (!currentMe) return;

    cache.writeQuery<MeResult>({
      query: QUERY_ME,
      data: {
        me: {
          ...currentMe,
          notifications: (currentMe.notifications ?? []).map((n) => ({
            ...n,
            read: true,
          })),
        },
      },
    });
  },
});

  const notifications = useMemo(() => {
    const list = me?.notifications ?? [];
    return [...list].sort(
      (a: any, b: any) =>
        new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
        new Date(a?.date ?? a?.createdAt ?? 0).getTime()
    );
  }, [me?.notifications]);

  const unread = (me?.notifications ?? []).filter(
    (n: any) => n?.read === false || n?.read === "false"
  );
  const unreadCount = unread.length;

  const handleClick = async () => {
    try {
      if (me?.refId && unreadCount > 0) {
        await markAllNotificationsRead({ variables: { refId: me.refId } });
      }
    } catch (e) {
      console.error("Failed to mark notifications as read:", e);
    } finally {
      setOpen(false);
      navigate("/affiliate/notifications");
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
            {notifications?.map((n: any, i: number) => {
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

// import { useState, useRef, useEffect, useMemo } from "react";
// import { IoNotificationsOutline } from "react-icons/io5";
// import { useMutation } from "@apollo/client";
// import { QUERY_ME } from "../utils/queries";
// import {
//   // UPDATE_NOTIFICATION_READ_STATUS,          // keep if you later add per-item actions
//   MARK_ALL_NOTIFICATIONS_READ,              // ⬅️ use this for "View all"
// } from "../utils/mutations";
// import { useNavigate } from "react-router-dom";
// import { Affiliate } from "../types";
// import { AffiliateOutletContext } from "./AffiliateDashboard";

// import "./NotificationMenu.css";

// type Props = {
//   me?: Affiliate;
//   onboardingStatus: AffiliateOutletContext["onboardingStatus"];
// };

// export default function NotificationMenu({ me, onboardingStatus }: Props) {
//   const [open, setOpen] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);

//   // Optional: keep this if you later add “mark single item read”
//   // const [updateNotificationReadStatus] = useMutation(
//   //   UPDATE_NOTIFICATION_READ_STATUS,
//   //   { refetchQueries: [{ query: QUERY_ME }], awaitRefetchQueries: true }
//   // );

//   // Use the "mark all read" mutation for the footer button
//   const [markAllNotificationsRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
//     refetchQueries: [{ query: QUERY_ME }],
//     awaitRefetchQueries: true,
//   });

//   const notifications = useMemo(() => {
//     const list = me?.notifications ?? [];
//     return [...list].sort(
//       (a: any, b: any) =>
//         new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
//         new Date(a?.date ?? a?.createdAt ?? 0).getTime()
//     );
//   }, [me?.notifications]);

//   const unread = useMemo(
//     () => (notifications ?? []).filter((n: any) => n?.read === false || n?.read === "false"),
//     [notifications]
//   );

//   const unreadCount = unread.length;
//   const navigate = useNavigate();

//   const handleClick = async () => {
//     // "View all" → mark ALL as read, then go to the notifications page
//     try {
//       if (me?.refId && unreadCount > 0) {
//         await markAllNotificationsRead({ variables: { refId: me.refId } });
//       }
//     } catch (e) {
//       console.error("Failed to mark notifications as read:", e);
//     } finally {
//       setOpen(false);
//       navigate("/affiliate/notifications", { state: { openedFromMenu: true } });
//     }
//   };

//   const formatDate = (dateStr: string) =>
//     new Date(dateStr).toLocaleString("en-US", {
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   // Close menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (onboardingStatus.loading) return null;

//   return (
//     <div className="notification-container" ref={menuRef}>
//       <button
//         className="notification-button"
//         onClick={() => setOpen(!open)}
//         aria-haspopup="menu"
//         aria-expanded={open}
//         aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
//       >
//         <IoNotificationsOutline className="bell-icon" />
//         {unreadCount > 0 && <span className="notification-dot" />}
//       </button>

//       {open && (
//         <div className="notification-dropdown" role="menu" aria-label="Notifications">
//           <div className="dropdown-header p-3">Notifications</div>
//           <ul className="notification-list">
//             {notifications?.map((n: any, i: number) => {
//               const isUnread = n?.read === false || n?.read === "false";
//               const ts = n?.date ?? n?.createdAt;
//               return (
//                 <li
//                   key={n?.id ?? n?._id ?? `${n?.title ?? "n"}-${i}`}
//                   className={`notification-item ${isUnread ? "unread" : ""}`}
//                 >
//                   <div className="text-wrap">
//                     <div className="message">{n?.text ?? n?.title}</div>
//                     <div className="time">{ts ? formatDate(ts) : ""}</div>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//           <div className="dropdown-footer">
//             <button onClick={handleClick}>View all</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // import { useState, useRef, useEffect, useMemo } from "react";
// // import { IoNotificationsOutline } from "react-icons/io5";
// // import { useMutation } from "@apollo/client";
// // import { QUERY_ME } from "../utils/queries";
// // import { UPDATE_NOTIFICATION_READ_STATUS } from "../utils/mutations";
// // import { useNavigate } from "react-router-dom";
// // // import { useOnBoardingNotifications } from "../hooks/useOnBoardingNotifications";
// // import { Affiliate } from "../types";
// // import { AffiliateOutletContext } from "./AffiliateDashboard";

// // import "./NotificationMenu.css";

// // type Props = {
// //   me?: Affiliate;
// //   onboardingStatus: AffiliateOutletContext["onboardingStatus"]
// // }
// // export default function NotificationMenu({ me, onboardingStatus }: Props) {

// //   const [open, setOpen] = useState(false);
// //   const menuRef = useRef<HTMLDivElement>(null);

// //   // Creates notifications when appropriate (your custom hook)
// //   // useOnBoardingNotifications();

// //   const [updateNotificationReadStatus] = useMutation(
// //     UPDATE_NOTIFICATION_READ_STATUS,
// //     { refetchQueries: [{ query: QUERY_ME }] }
// //   );

// //   const notifications = useMemo(() => {
// //     const list = me?.notifications ?? [];
// //     return [...list].sort(
// //       (a: any, b: any) =>
// //         new Date(b?.date ?? b?.createdAt).getTime() -
// //         new Date(a?.date ?? a?.createdAt).getTime()
// //     );
// //   }, [me?.notifications]);

// //   const unread = useMemo(
// //     () =>
// //       (notifications ?? []).filter(
// //         (n: any) => n?.read === false || n?.read === "false"
// //       ),
// //     [notifications]
// //   );

// //   const unreadCount = unread.length;

// //   const navigate = useNavigate();

// //   const handleClick = async () => {
// //     console.log("view all clicked");
// //     return;
// //     // try {
// //     //   if (me?.refId && unread.length) {
// //     //     await Promise.all(
// //     //       unread.map((n: any) =>
// //     //         updateNotificationReadStatus({
// //     //           variables: { refId: me?.refId, title: n.title, read: true },
// //     //         })
// //     //       )
// //     //     );
// //     //   }
// //     // } catch (e) {
// //     //   console.error("Failed to mark notifications as read:", e);
// //     // } finally {
// //     //   setOpen(false);
// //     //   navigate("/affiliate/notifications", { state: { openedFromMenu: true } });
// //     // }
// //   };

// //   const formatDate = (dateStr: string) =>
// //     new Date(dateStr).toLocaleString("en-US", {
// //       month: "short",
// //       day: "numeric",
// //       hour: "2-digit",
// //       minute: "2-digit",
// //     });

// //   // Close menu when clicking outside
// //   useEffect(() => {
// //     const handleClickOutside = (e: MouseEvent) => {
// //       if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
// //         setOpen(false);
// //       }
// //     };
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   if (onboardingStatus.loading) return null;

// //   return (
// //     <div className="notification-container" ref={menuRef}>
// //       <button
// //         className="notification-button"
// //         onClick={() => setOpen(!open)}
// //         aria-haspopup="menu"
// //         aria-expanded={open}
// //         aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
// //       >
// //         <IoNotificationsOutline className="bell-icon" />
// //         {unreadCount > 0 && <span className="notification-dot" />}
// //       </button>

// //       {open && (
// //         <div className="notification-dropdown" role="menu" aria-label="Notifications">
// //           <div className="dropdown-header p-3">Notifications</div>
// //           <ul className="notification-list">
// //             {notifications?.map((n: any, i: number) => {
// //               const isUnread = n?.read === false || n?.read === "false";
// //               const ts = n?.date ?? n?.createdAt;
// //               return (
// //                 <li
// //                   key={n?.id ?? n?._id ?? `${n?.title ?? "n"}-${i}`}
// //                   className={`notification-item ${isUnread ? "unread" : ""}`}
// //                 >
// //                   <div className="text-wrap">
// //                     <div className="message">{n?.text}</div>
// //                     <div className="time">{ts ? formatDate(ts) : ""}</div>
// //                   </div>
// //                 </li>
// //               );
// //             })}
// //           </ul>
// //           <div className="dropdown-footer">
// //             <button onClick={handleClick}>View all</button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
