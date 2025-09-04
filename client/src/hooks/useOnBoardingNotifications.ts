import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import {
  CREATE_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS, // kept if you use elsewhere
} from "../utils/mutations";
import { QUERY_ME } from "../utils/queries";
import useCheckOnboardingStatus from "./useCheckOnboardingStatus";

type Phase = "not_started" | "in_progress" | "complete";

// Deterministic titles by state
const TITLE_BY_STATE: Record<Phase, string> = {
  not_started: "Stripe account not connected",
  in_progress: "Finish your Stripe onboarding",
  complete: "Success, Stripe onboarding complete",
};

export function useOnBoardingNotifications() {
  const [createNotification] = useMutation(CREATE_NOTIFICATION, {
    refetchQueries: [{ query: QUERY_ME }],
  });

  const { data, loading } = useQuery(QUERY_ME);
  const me = data?.me || {};
  const notifications = me?.notifications ?? [];

  const {
    state, // "not_started" | "in_progress" | "complete"
    onboardingStatusMessage,
    onboardingNotificationTitle,
    loading: statusLoading,
  } = useCheckOnboardingStatus(me.id);

  // Avoid duplicate creates from React Strict Mode double-invoke (dev)
  const hasHandledNotification = useRef(false);

  // Helper: get latest timestamp among notifications with any title in the set
  const latestTsForTitles = (titles: Set<string>) => {
    let latest = 0;
    for (const n of notifications as any[]) {
      const t = n?.title;
      if (!t || !titles.has(t)) continue;
      const raw = (n as any)?.date ?? (n as any)?.createdAt;
      const ts =
        typeof raw === "string" || typeof raw === "number"
          ? new Date(raw).getTime()
          : new Date(
              // tolerate Mongo-ish shapes if ever passed through
              (raw as any)?.$date?.$numberLong
                ? Number((raw as any).$date.$numberLong)
                : Date.now()
            ).getTime();
      if (Number.isFinite(ts) && ts > latest) latest = ts;
    }
    return latest; // 0 means none found
  };

  useEffect(() => {
    if (
      !me?.refId ||
      hasHandledNotification.current ||
      loading ||
      statusLoading ||
      !onboardingNotificationTitle ||
      !onboardingStatusMessage
    ) {
      return;
    }

    const run = async () => {
      try {
        // Special-case: success should NOT be recreated on every login.
        // Only create a new success notification if there was a NEW onboarding cycle
        // after the last success (i.e., a newer "not_started" or "in_progress" event).
        if (state === "complete") {
          const successTitle = TITLE_BY_STATE.complete;
          const resetTitles = new Set<string>([
            TITLE_BY_STATE.not_started,
            TITLE_BY_STATE.in_progress,
          ]);

          const lastSuccessTs = latestTsForTitles(new Set([successTitle]));
          const lastResetTs = latestTsForTitles(resetTitles);

          const shouldCreateSuccess =
            lastSuccessTs === 0 || lastResetTs > lastSuccessTs;

          if (shouldCreateSuccess) {
            await createNotification({
              variables: {
                refId: me.refId,
                title: successTitle,
                text: onboardingStatusMessage, // "✅ Your Stripe account is connected and ready for payouts."
                read: false,
              },
            });
          }
        } else {
          // Default behavior for everything else:
          // systematically create a new unread notification each time
          await createNotification({
            variables: {
              refId: me.refId,
              title: onboardingNotificationTitle,
              text: onboardingStatusMessage,
              read: false,
            },
          });
        }
      } finally {
        // Prevent double-create in Strict Mode on this mount
        hasHandledNotification.current = true;
      }
    };

    run();
  }, [
    me?.refId,
    state,
    onboardingNotificationTitle,
    onboardingStatusMessage,
    notifications, // needed for success dedupe logic
    loading,
    statusLoading,
    createNotification,
  ]);

  return null;
}
