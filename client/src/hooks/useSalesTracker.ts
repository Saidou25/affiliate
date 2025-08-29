import { useQuery } from "@apollo/client";
import { GET_AFFILIATESALES } from "../utils/queries";
import { useEffect, useState } from "react";

// interface Affiliate {
//   id: string;
//   name?: string;
//   email: string;
//   refId?: string;
//   totalClicks?: number;
//   totalCommissions?: number;
//   commissionRate?: number;
//   totalSales?: number;
// }

type DataObj = {
  x: string; // label (date, week, or month)
  y: number; // count
};

type SaleObj = {
  id: string;
  data: DataObj[];
};

export function useSalesTracker(affiliateRefId: string) {
  const [referenceId, setReferenceId] = useState("");
  const [totalSales, setTotalSales] = useState(0);
  const [salesPerDay, setSalesPerDay] = useState<SaleObj[]>([]);
  const [salesPerWeek, setSalesPerWeek] = useState<SaleObj[]>([]);
  const [salesPerMonth, setSalesPerMonth] = useState<SaleObj[]>([]);

  // const { data } = useQuery(QUERY_ME);
  const { data: salesData } = useQuery(GET_AFFILIATESALES, {
    variables: { refId: referenceId },
    skip: !referenceId,
  });

  const toEasternDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-US", {
      timeZone: "America/New_York",
    });

  const toWeekLabel = (isoDate: string) => {
    const date = new Date(isoDate);
    const onejan = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
    );
    return `Week ${week}, ${date.getFullYear()}`;
  };

  const toMonthLabel = (isoDate: string) =>
    new Date(isoDate).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "long",
      year: "numeric",
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

  useEffect(() => {
    if (salesData?.getAffiliateSales && referenceId) {
      const sortedSales = [...salesData.getAffiliateSales].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const dayLabels = sortedSales.map((sale: any) =>
        toEasternDate(sale.createdAt)
      );
      const allDateObjs = dayLabels.map((d: string) => new Date(d));
      const min = new Date(
        Math.min(...allDateObjs.map((d: Date) => d.getTime()))
      );
      const max = new Date(
        Math.max(...allDateObjs.map((d: Date) => d.getTime()))
      );
      const fullDateRange = getDateRange(min, max);

      const dailyCount: Record<string, number> = {};
      const weeklyCount: Record<string, number> = {};
      const monthlyCount: Record<string, number> = {};

      for (const sale of sortedSales) {
        const day = toEasternDate(sale.createdAt);
        const week = toWeekLabel(sale.createdAt);
        const month = toMonthLabel(sale.createdAt);

        dailyCount[day] = (dailyCount[day] || 0) + 1;
        weeklyCount[week] = (weeklyCount[week] || 0) + 1;
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
      }

      const dailyData: DataObj[] = fullDateRange.map((date) => ({
        x: date,
        y: dailyCount[date] || 0,
      }));

      const weeklyData: DataObj[] = Object.entries(weeklyCount)
        .map(([week, count]) => ({
          x: week,
          y: count,
        }))
        .sort((a, b) => {
          const [_, weekA, yearA] = a.x.match(/Week (\d+), (\d+)/) || [];
          const [__, weekB, yearB] = b.x.match(/Week (\d+), (\d+)/) || [];
          return +yearA !== +yearB ? +yearA - +yearB : +weekA - +weekB;
        });

      const monthlyData: DataObj[] = Object.entries(monthlyCount)
        .map(([month, count]) => ({
          x: month,
          y: count,
        }))
        .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

      setSalesPerDay([{ id: "Sales per day", data: dailyData }]);
      setSalesPerWeek([{ id: "Sales per week", data: weeklyData }]);
      setSalesPerMonth([{ id: "Sales per month", data: monthlyData }]);
    }
  }, [salesData, referenceId]);

  useEffect(() => {
    setReferenceId(affiliateRefId);
  }, [affiliateRefId]);

  useEffect(() => {
    if (salesData?.getAffiliateSales) {
      setTotalSales(salesData.getAffiliateSales.length);
    }
  }, [salesData]);

  return { totalSales, salesPerDay, salesPerWeek, salesPerMonth };
}
