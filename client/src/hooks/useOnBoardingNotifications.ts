import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_NOTIFICATION,
  UPDATE_NOTIFICATION_READ_STATUS,
} from "../utils/mutations";
import { useEffect, useRef } from "react";
import { QUERY_ME } from "../utils/queries";
import useCheckOnboardingStatus from "./useCheckOnboardingStatus";

export function useOnBoardingNotifications() {
  const [createNotification] = useMutation(CREATE_NOTIFICATION, {
    refetchQueries: [{ query: QUERY_ME }],
  });
  const [updateNotificationReadStatus] = useMutation(
    UPDATE_NOTIFICATION_READ_STATUS,
    {
      refetchQueries: [{ query: QUERY_ME }],
    }
  );

  const hasHandledNotification = useRef(false);
  const { data, loading } = useQuery(QUERY_ME);
  const me = data?.me || {};
  const notifications = me?.notifications ?? [];

  const {
    isStripeMissing,
    isOnboardingIncomplete,
    isFullyOnboarded,
    onboardingStatusMessage,
    onboardingNotificationTitle,
  } = useCheckOnboardingStatus(me.id);

  useEffect(() => {
    if (
      !me?.refId ||
      hasHandledNotification.current ||
      loading ||
      !onboardingNotificationTitle || !onboardingStatusMessage //  waits until title is defined
    ) {
      return;
    }
    const processNotifications = async () => {
      if (
        (isStripeMissing || isOnboardingIncomplete || isFullyOnboarded) &&
        onboardingNotificationTitle
      ) {
        const existingNotification = notifications.find(
          (n: any) => n.title === onboardingNotificationTitle
        );

        if (!existingNotification) {
          await createNotification({
            variables: {
              refId: me.refId,
              title: onboardingNotificationTitle,
              text: onboardingStatusMessage,
              read: false,
            },
          });
        } else if (existingNotification.read) {
          await updateNotificationReadStatus({
            variables: {
              refId: me.refId,
              title: onboardingNotificationTitle,
              read: false,
            },
          });
        }
      }

      hasHandledNotification.current = true;
    };

    processNotifications();
  }, [
    me?.refId,
    isStripeMissing,
    isOnboardingIncomplete,
    onboardingNotificationTitle,
    onboardingStatusMessage,
    notifications,
    loading,
  ]);

  return null;
}
