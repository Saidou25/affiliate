import { useMemo, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import {
  MARK_ALL_NOTIFICATIONS_READ,
  MARK_NOTIFICATION_READ,
} from "../utils/mutations";
import { Affiliate } from "../types";

type MeResult = {
  me?: {
    notifications?: Array<Record<string, any> & { read?: boolean }>;
  };
};

export function useNotifications(me?: Affiliate) {
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

  const [markOne] = useMutation(MARK_NOTIFICATION_READ, {
    // no optimistic, no refetch — rely on cache update only
    update(cache, _result, { variables }) {
      const prev = cache.readQuery<MeResult>({ query: QUERY_ME });
      if (!prev?.me) return;

      const clickedId = String((variables as any)?.notificationId);

      cache.writeQuery<MeResult>({
        query: QUERY_ME,
        data: {
          me: {
            ...prev.me,
            notifications: (prev.me.notifications ?? []).map((n: any) => {
              const id = String(n?.id ?? n?._id);
              return id === clickedId ? { ...n, read: true } : n;
            }),
          },
        },
      });
    },
  });

  // 3) Derived data
  const notifications = useMemo(() => {
    const list = me?.notifications ?? [];
    return [...list].sort(
      (a: any, b: any) =>
        new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
        new Date(a?.date ?? a?.createdAt ?? 0).getTime()
    );
  }, [me?.notifications]);

  const unread = useMemo(
    () =>
      notifications.filter(
        (n: any) => n?.read === false || n?.read === "false"
      ),
    [notifications]
  );

  // 4) Action helpers
  const markAllRead = useCallback(async () => {
    if (!me?.refId) return;
    await markAllNotificationsRead({ variables: { refId: me.refId } });
  }, [markAllNotificationsRead, me?.refId]);

  const markNotificationRead = useCallback(
    async (notificationId: any) => {
      if (!me?.refId || !notificationId) return;
      try {
        const res = await markOne({
          variables: { refId: me.refId, notificationId },
        });
        if (res) {
          console.log("success");
        }
      } catch (error) {
        console.log(error);
      }
    },
    [markOne, me?.refId]
  );

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    markAllRead,
    markNotificationRead,
  };
}
