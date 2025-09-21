import { useQuery } from "@apollo/client";
import { GET_AFFILIATECLICKLOGS, QUERY_ME } from "../utils/queries";
import { useEffect, useState } from "react";

interface Affiliate {
  id: string;
  name?: string;
  email: string;
  refId?: string;
  totalClicks?: number;
  totalCommissions?: number;
  commissionRate?: number;
  totalSales?: number;
}

type DataObj = {
  x: string; // date label
  y: number; // count
};

type ClickObj = {
  id: string;
  data: DataObj[];
};

export function useClicksTracker() {
  const [me, setMe] = useState<Affiliate | null>(null);
  const [clicksPerDay, setClicksPerDay] = useState<ClickObj[]>([]);
  const [clicksPerWeek, setClicksPerWeek] = useState<ClickObj[]>([]);
  const [clicksPerMonth, setClicksPerMonth] = useState<ClickObj[]>([]);

  const { data } = useQuery(QUERY_ME);
  const { data: clicksData } = useQuery(GET_AFFILIATECLICKLOGS, {
    variables: { refId: me?.refId },
    skip: !me?.refId,
  });

  const getDateRange = (start: Date, end: Date) => {
    const range: string[] = [];

    // normalize both to ET day boundaries inside the function
    const toET = (d: Date) =>
      new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const s = toET(start);
    s.setHours(0, 0, 0, 0);
    const e = toET(end);
    e.setHours(23, 59, 59, 999);

    const current = new Date(s);
    while (current <= e) {
      range.push(
        current.toLocaleDateString("en-US", { timeZone: "America/New_York" })
      );
      current.setDate(current.getDate() + 1); // time-of-day stays at 00:00
    }
    return range;
  };

  const groupBy = (
    dates: Date[],
    formatter: (d: Date) => string
  ): Record<string, number> => {
    const grouped: Record<string, number> = {};
    for (const date of dates) {
      const label = formatter(date);
      grouped[label] = (grouped[label] || 0) + 1;
    }
    return grouped;
  };

  // Safe date coercion
  const toDate = (v: any): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") {
      const s = v.trim();
      if (/^\d+$/.test(s)) return new Date(Number(s)); // <- Unix ms string
      return new Date(s); // ISO string
    }
    try {
      return new Date(v);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (clicksData?.getAffiliateClickLogs) {
      const sortedClicks = [...(clicksData?.getAffiliateClickLogs ?? [])]
        .filter((c: any) => c?.createdAt != null)
        .sort(
          (a: any, b: any) =>
            toDate(a.createdAt)!.getTime() - toDate(b.createdAt)!.getTime()
        );

      const allDateObjects: Date[] = sortedClicks
        .map((c: any) => toDate(c.createdAt))
        .filter(
          (d: Date | null): d is Date => !!d && !Number.isNaN(d.getTime())
        );

      // 1. Per Day
      const toEasternDate = (date: Date | string) =>
        new Date(date).toLocaleDateString("en-US", {
          timeZone: "America/New_York",
        });

      const allDates = allDateObjects.map(toEasternDate);

      const minDate = new Date(
        Math.min(...allDateObjects.map((d) => d.getTime()))
      );

      const maxDate = new Date(
        Math.max(...allDateObjects.map((d) => d.getTime()))
      );

      const fullDateRange = getDateRange(minDate, maxDate);

      const clicksCountPerDay: Record<string, number> = {};
      for (const date of allDates) {
        clicksCountPerDay[date] = (clicksCountPerDay[date] || 0) + 1;
      }

      const dayData: DataObj[] = fullDateRange.map((date) => ({
        x: date,
        y: clicksCountPerDay[date] || 0,
      }));

      setClicksPerDay([{ id: "Clicks per Day", data: dayData }]);

      // 2. Per Week (e.g. 2025-W20)
      const weekFormatter = (d: Date) => {
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) /
            7
        );
        return `${d.getFullYear()}-W${week}`;
      };
      const weekCounts = groupBy(allDateObjects, weekFormatter);
      const weekData: DataObj[] = Object.entries(weekCounts)
        .map(([x, y]) => ({ x, y }))
        .sort((a, b) => {
          const [yearA, weekA] = a.x.split("-W").map(Number);
          const [yearB, weekB] = b.x.split("-W").map(Number);
          return yearA !== yearB ? yearA - yearB : weekA - weekB;
        });

      setClicksPerWeek([{ id: "Clicks per Week", data: weekData }]);

      // 3. Per Month (e.g. May 2025)
      const monthFormatter = (d: Date) =>
        d.toLocaleString("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "long",
        });
      const monthCounts = groupBy(allDateObjects, monthFormatter);
      const monthData: DataObj[] = Object.entries(monthCounts)
        .map(([x, y]) => ({ x, y }))
        .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
      setClicksPerMonth([{ id: "Clicks per Month", data: monthData }]);
    }
  }, [clicksData, me]);

  useEffect(() => {
    if (data?.me) {
      setMe(data.me);
    }
  }, [data]);

  return { clicksPerDay, clicksPerWeek, clicksPerMonth };
}
