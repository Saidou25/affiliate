import { useEffect, useMemo, useRef } from "react";
import { Affiliate } from "../types";
import { AffiliateOutletContext } from "../components/AffiliateDashboard";
import { useMutation } from "@apollo/client";
import {
  CREATE_NOTIFICATION,
  DELETE_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS,
} from "../utils/mutations";
import { useResetOnboardingCycle } from "./resetOnboardingCycle";

type State = "not_started" | "in_progress" | "complete";

export function useOnBoardingNotifications(
  me: Affiliate | undefined,
  onboardingStatus?: AffiliateOutletContext["onboardingStatus"]
) {
  const [createNotification] = useMutation(CREATE_NOTIFICATION);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);
  const [updateNotificationReadStatus] = useMutation(
    UPDATE_NOTIFICATION_READ_STATUS
  );

  const deleteOnboarding = useResetOnboardingCycle();
  // derives status once, optionally override in dev
  // Always concrete (no undefined)
  const status: State = (onboardingStatus?.state ?? "not_started") as State;
  // if (import.meta.env?.DEV ?? process.env.NODE_ENV !== "production") {
  //   status = "complete"; // for testing this path
  // }

  // hase guard: remember the last processed phase to prevent re-running on cache churn
  const lastPhaseRef = useRef<State | null>(null);

  useEffect(() => {
    if (!me?.refId) return;

    // Skip if we already processed this phase
    if (lastPhaseRef.current === status) return;

    const notifications = me?.notifications ?? [];

    const notConnected = notifications.find(
      (n: any) => (n?.title ?? "") === "Stripe account not connected"
    );
    const finishOnboarding = notifications.find(
      (n: any) => (n?.title ?? "") === "Finish your Stripe onboarding"
    );
    const onboardingComplete = notifications.find(
      (n: any) => (n?.title ?? "") === "Onboarding complete"
    );

    // --- 1) Regression detection: previously "complete" but now NOT complete
    const regressed =
      onboardingComplete &&
      (status === "not_started" || status === "in_progress");

    if (regressed) {
      void deleteOnboarding(me.refId);
      lastPhaseRef.current = status; // record processed phase
      return;
    }

    let acted = false;

    for (const notification of notifications.length
      ? notifications
      : [null as any]) {
      if (acted) break;

      switch (status) {
        case "not_started": {
          const exists = !!notConnected;

          if (!exists) {
            createNotification({
              variables: {
                refId: me.refId,
                title: "Stripe account not connected",
                text: "You haven't connected a payment method yet. To receive your commissions, please link your Stripe account.",
              },
            });
            acted = true;
            break;
          }

          if (
            notification &&
            notification.title === "Stripe account not connected" &&
            notification.read !== false
          ) {
            const notificationId =
              (notification as any).id ?? String((notification as any)._id);
            if (notificationId) {
              updateNotificationReadStatus({
                variables: { refId: me.refId, notificationId },
              });
              acted = true;
            }
          }
          break;
        }

        case "in_progress": {
          const exists = !!finishOnboarding;

          if (!exists) {
            createNotification({
              variables: {
                refId: me.refId,
                title: "Finish your Stripe onboarding",
                text: "Almost there! Please finish setting up your Stripe account to start receiving payouts.",
              },
            });
            acted = true;
            break;
          }

          if (
            notification &&
            notification.title === "Finish your Stripe onboarding" &&
            notification.read !== false
          ) {
            const notificationId =
              (notification as any).id ?? String((notification as any)._id);
            if (notificationId) {
              updateNotificationReadStatus({
                variables: { refId: me.refId, notificationId },
              });
              acted = true;
            }
          }
          break;
        }

        case "complete": {
          // ✅ Create a single "Onboarding complete" notification if it doesn't exist
          if (!onboardingComplete) {
            createNotification({
              variables: {
                refId: me.refId,
                title: "Onboarding complete",
                text: "Congratulations! Your Stripe account has been fully set up. You’re ready to receive payouts.",
              },
            });
            acted = true;
          }
          break;
        }

        default:
          if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
            console.debug(
              "[notifications] unhandled onboarding status:",
              status
            );
          }
          break;
      }
    }
    // record processed phase so we don't run again unless phase changes
    lastPhaseRef.current = status;
  }, [
    me?.refId,
    status,
    createNotification,
    deleteNotification,
    updateNotificationReadStatus,
    deleteOnboarding,
  ]);

  // Return all notifications, newest first
  const sorted = useMemo(() => {
    const list = me?.notifications ?? [];
    return [...list].sort(
      (a: any, b: any) =>
        new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
        new Date(a?.date ?? a?.createdAt ?? 0).getTime()
    );
  }, [me?.notifications]);

  return sorted;
}
