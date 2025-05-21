import { useQuery } from "@apollo/client";
import { GET_AFFILIATESALES, QUERY_ME } from "../utils/queries";
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

type SaleObj = {
  id: string;
  data: DataObj[];
};

export function useSalesTracker() {
  const [me, setMe] = useState<Affiliate | null>(null);
  const [salesPerDay, setSalesPerDay] = useState<SaleObj[]>([]);

  const { data } = useQuery(QUERY_ME);
  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
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
    if (salesData?.getAffiliateSales && me?.refId) {
      const salesArray = salesData.getAffiliateSales;

      // Convert all timestamps to Eastern date strings
      const allDates = salesArray.map((sale: any) => toEasternDate(sale.timestamp));

      // Determine earliest and latest dates
      const easternDatesAsDates = allDates.map((date: string) => new Date(date));
      const minDate = new Date(Math.min(...easternDatesAsDates.map((d: Date) => d.getTime())));
      const maxDate = new Date(Math.max(...easternDatesAsDates.map((d: Date) => d.getTime())));

      const fullDateRange = getDateRange(minDate, maxDate);

      // Count sales per date
      const salesCount: Record<string, number> = {};
      for (const date of allDates) {
        salesCount[date] = (salesCount[date] || 0) + 1;
      }

      // Build final array
      const fullData: DataObj[] = fullDateRange.map(date => ({
        x: date,
        y: salesCount[date] || 0,
      }));

      setSalesPerDay([{ id: me.refId, data: fullData }]);
    }
  }, [salesData, me]);

  useEffect(() => {
    if (data?.me) {
      setMe(data.me);
    }
  }, [data]);

  return salesPerDay;
}
