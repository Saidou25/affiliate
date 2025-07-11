import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import { QUERY_ME } from "../utils/queries";
import {
  CREATE_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS,
} from "../utils/mutations";
import useCheckOnboardingStatus from "./useCheckOnboardingStatus";

export function useOnBoardingNotifications() {
  const [createNotification] = useMutation(CREATE_NOTIFICATION);
  const [updateNotificationReadStatus] = useMutation(
    UPDATE_NOTIFICATION_READ_STATUS
  );

  // useRef guard ensures the logic runs once.
  // useRef lets us track whether we've already run something, without re-triggering the component update cycle.
  const hasHandledNotification = useRef(false);

  const { data, loading } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { stripeStatusData } = useCheckOnboardingStatus(me.id);

  const notifications = me?.notifications ?? [];

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
      console.log("Create notification failed:", error);
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
      console.log("Update notification failed:", error);
    }
  };

  useEffect(() => {
    if (stripeStatusData?.id && !stripeStatusData?.charges_enabled) {
      const title = "You haven’t completed onboarding yet.";
      const text = "Please finish completing your Stripe setup";
      createNewNotification(title, text);
    } else if (stripeStatusData?.charges_enabled) {
      const title = "Onboarding completed";
      const text =
        "Congratulation, you are now enrolled with Stripe payment and able to receive commissions payments.";
      createNewNotification(title, text);
    }
  }, [stripeStatusData]);

  // ✅ Trigger notification if Stripe is not setup
  useEffect(() => {
    if (hasHandledNotification.current) return;
    if (loading || !me?.refId) return;
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
        // If it was marked as read but stripe account still not setup, make it unread again
        updateNotificationStatus(title);
      }
    }
    hasHandledNotification.current = true;
  }, [me?.refId, me?.stripeAccountId, notifications]);

  return null;
}
