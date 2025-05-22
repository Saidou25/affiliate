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

  const toEasternDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });

  const getDateRange = (start: Date, end: Date) => {
    const range: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      range.push(
        current.toLocaleDateString("en-US", { timeZone: "America/New_York" })
      );
      current.setDate(current.getDate() + 1);
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

  useEffect(() => {
    if (clicksData?.getAffiliateClickLogs) {
      const clicksArray = clicksData.getAffiliateClickLogs;

      const allDateObjects = clicksArray.map((click: any) =>
        new Date(
          new Date(click.createdAt).toLocaleString("en-US", {
            timeZone: "America/New_York",
          })
        )
      );

      // 1. Per Day
      const allDates = allDateObjects.map((d: Date) =>
        d.toLocaleDateString("en-US", { timeZone: "America/New_York" })
      );
      const minDate = new Date(Math.min(...allDateObjects.map((d: Date) => d.getTime())));
      const maxDate = new Date(Math.max(...allDateObjects.map((d: Date) => d.getTime())));
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
          ((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7
        );
        return `${d.getFullYear()}-W${week}`;
      };
      const weekCounts = groupBy(allDateObjects, weekFormatter);
      const weekData: DataObj[] = Object.entries(weekCounts).map(([x, y]) => ({
        x,
        y,
      }));
      setClicksPerWeek([{ id: "Clicks per Week", data: weekData }]);

      // 3. Per Month (e.g. May 2025)
      const monthFormatter = (d: Date) =>
        d.toLocaleString("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "long",
        });
      const monthCounts = groupBy(allDateObjects, monthFormatter);
      const monthData: DataObj[] = Object.entries(monthCounts).map(([x, y]) => ({
        x,
        y,
      }));
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
