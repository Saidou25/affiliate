import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { AffiliateOutletContext } from "../components/AffiliateDashboard";

export default function useSortNotifications() {
  const { me, meLoading } = useOutletContext<AffiliateOutletContext>();

  const notifications = useMemo(() => {
    if (!me) return undefined; // still loading context
    const list = me?.notifications ?? []; // normalize: empty array when none
    return [...list].sort(
      (a: any, b: any) =>
        new Date(b?.date ?? b?.createdAt ?? 0).getTime() -
        new Date(a?.date ?? a?.createdAt ?? 0).getTime()
    );
  }, [me]);
  return { notifications, loading: meLoading || !me };
}
