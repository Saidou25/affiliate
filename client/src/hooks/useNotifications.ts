// // hooks/useNotifications.ts
// import { useMemo, useCallback } from "react";
// import { useMutation } from "@apollo/client";
// import { Affiliate } from "../types";
// import { AffiliateOutletContext } from "../components/AffiliateDashboard";
// import { QUERY_ME } from "../utils/queries";
// import {
//   MARK_ALL_NOTIFICATIONS_READ,
//   UPDATE_NOTIFICATION_READ_STATUS,
// } from "../utils/mutations";
// import { useOnBoardingNotifications } from "./useOnBoardingNotifications";

// export function useNotifications(
//   me: Affiliate | undefined,
//   onboardingStatus: AffiliateOutletContext["onboardingStatus"]
// ) {
//   // 1) Run system/onboarding side effects safely
//   useOnBoardingNotifications(me, onboardingStatus);

//   // 2) Mutations for UI actions
//   const [markAll] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
//     refetchQueries: [{ query: QUERY_ME }],
//     awaitRefetchQueries: true,
//   });
//   const [markOne] = useMutation(UPDATE_NOTIFICATION_READ_STATUS, {
//     refetchQueries: [{ query: QUERY_ME }],
//     awaitRefetchQueries: true,
//   });

//   // 3) Derived data
//   const notifications = useMemo(() => {
//     const list = me?.notifications ?? [];
//     return [...list].sort(
//       (a: any, b: any) =>
//         new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
//         new Date(a?.date ?? a?.createdAt ?? 0).getTime()
//     );
//   }, [me?.notifications]);

//   const unread = useMemo(
//     () => notifications.filter((n: any) => n?.read === false || n?.read === "false"),
//     [notifications]
//   );

//   // 4) Action helpers
//   const markAllRead = useCallback(async () => {
//     if (!me?.refId) return;
//     await markAll({ variables: { refId: me.refId } });
//   }, [markAll, me?.refId]);

//   const markNotificationRead = useCallback(
//     async (notification: any) => {
//       const id = notification?.id ?? String(notification?._id);
//       if (!me?.refId || !id) return;
//       await markOne({ variables: { refId: me.refId, notificationId: id } });
//     },
//     [markOne, me?.refId]
//   );

//   return { notifications, unread, unreadCount: unread.length, markAllRead, markNotificationRead };
// }
