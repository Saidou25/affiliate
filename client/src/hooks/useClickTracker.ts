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
  x: string; // date
  y: number; // sales count
};

type ClikObj = {
  id: string;
  data: DataObj[];
};

export function useClickTracker() {
  const [me, setMe] = useState<Affiliate | null>(null);
  const [clickPerDay, setClickPerDay] = useState<ClikObj[]>([]);

  const { data } = useQuery(QUERY_ME);
  const { data: clicksData } = useQuery(GET_AFFILIATECLICKLOGS, {
    variables: { refId: me?.refId },
    skip: !me?.refId,
  });

  // Convert UTC timestamp to Eastern time (just the date part)
  const toEasternDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });

  // Generate array of dates between two dates (inclusive)
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

  useEffect(() => {
    if (clicksData?.getAffiliateClickLogs) {
      const clicksArray = clicksData.getAffiliateClickLogs;

      // Convert all timestamps to Eastern date strings
      const allDates = clicksArray.map((click: { createdAt: string }) =>
        toEasternDate(click.createdAt)
      );

      // Determine earliest and latest dates
      const easternDatesAsDates = allDates.map(
        (date: string) => new Date(date)
      );
      const minDate = new Date(
        Math.min(...easternDatesAsDates.map((d: Date) => d.getTime()))
      );
      const maxDate = new Date(
        Math.max(...easternDatesAsDates.map((d: Date) => d.getTime()))
      );

      const fullDateRange = getDateRange(minDate, maxDate);

      // Count sales per date
      const clicksCount: Record<string, number> = {};
      for (const date of allDates) {
        clicksCount[date] = (clicksCount[date] || 0) + 1;
      }

      // Build final array
      const fullData: DataObj[] = fullDateRange.map((date) => ({
        x: date,
        y: clicksCount[date] || 0,
      }));

      setClickPerDay([{ id: "clicks per day", data: fullData }]);
    }
  }, [clicksData, me]);

  useEffect(() => {
    if (data?.me) {
      setMe(data.me);
    }
  }, [data]);

  return clickPerDay;
}
