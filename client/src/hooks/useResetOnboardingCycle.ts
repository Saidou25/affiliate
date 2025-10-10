import { useMutation } from "@apollo/client";
import { DELETE_ONBOARDING_NOTIFICATIONS } from "../utils/mutations";

/**
 * Deletes all onboarding notifications for an affiliate and seeds
 * "Stripe account not connected". Updates Apollo cache (no refetch).
 *
 * Usage:
 *   const resetOnboardingCycle = useResetOnboardingCycle();
 *   await resetOnboardingCycle(refId);
 */
export function useResetOnboardingCycle() {
  const [deleteOnboarding] = useMutation(DELETE_ONBOARDING_NOTIFICATIONS);

  return async (refId: string): Promise<boolean> => {
    const { data } = await deleteOnboarding({
      variables: { refId },
      // Update cache so UI reflects the final list immediately
      update(cache, { data }) {
        const affiliate = data?.deleteOnboardingNotifications;
        if (!affiliate?.refId) return;

        const cacheId = cache.identify({
          __typename: "Affiliate",
          refId: affiliate.refId,
        });

        cache.modify({
          id: cacheId,
          fields: {
            notifications() {
              // overwrite with server-returned list
              return affiliate.notifications ?? [];
            },
          },
        });
      },
    });

    return Boolean(data?.deleteOnboardingNotifications);
  };
}
