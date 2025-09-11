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
  x: string; // label (date, week, or month)
  y: number; // total commission
};

type SaleObj = {
  id: string;
  data: DataObj[];
};

// This works per affiliate, not admin
export function useCommissionsTracker() {
  const [me, setMe] = useState<Affiliate | null>(null);
  const [commissionPerDay, setCommissionPerDay] = useState<SaleObj[]>([]);
  const [commissionsPerWeek, setCommissionsPerWeek] = useState<SaleObj[]>([]);
  const [commissionsPerMonth, setCommissionsPerMonth] = useState<SaleObj[]>([]);

  const { data } = useQuery(QUERY_ME);
  const refId = me?.refId;

  const {
    data: salesData,
    // loading: salesLoading,
    // error: salesError,
    // refetch,
  } = useQuery(GET_AFFILIATESALES, {
    variables: { filter: { refId }, limit: 200, offset: 0 },
    skip: !refId, // if refId is '', query won’t run
    fetchPolicy: "cache-and-network",
  });

  // ---------- helpers ----------
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  // Prefer stored commissionEarned if > 0; else compute from saleAmount * rate.
  // Tries several likely sale total field names and falls back to me.commissionRate.
  const getCommissionForSale = (sale: any, meRate?: number) => {
    const direct = num(sale?.commissionEarned);
    if (direct && direct > 0) return +direct.toFixed(2);

    const saleAmount =
      num(sale?.saleAmount) ??
      num(sale?.orderTotal) ??
      num(sale?.total) ??
      num(sale?.amount) ??
      0;

    const rate = num(sale?.commissionRate) ?? num(meRate) ?? 0;

    const computed = saleAmount * rate;
    return Number.isFinite(computed) ? +computed.toFixed(2) : 0;
  };

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
  // -----------------------------

  useEffect(() => {
    const sales = salesData?.getAffiliateSales;
    if (!sales || sales.length === 0) {
      setCommissionPerDay([]);
      setCommissionsPerWeek([]);
      setCommissionsPerMonth([]);
      return;
    }

    const sortedSales = [...sales].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const dayLabels = sortedSales.map((sale: any) =>
      toEasternDate(sale.createdAt)
    );
    const allDateObjs = dayLabels.map((d: string) => new Date(d));
    const minMs = Math.min(...allDateObjs.map((d: Date) => d.getTime()));
    const maxMs = Math.max(...allDateObjs.map((d: Date) => d.getTime()));
    if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) {
      setCommissionPerDay([]);
      setCommissionsPerWeek([]);
      setCommissionsPerMonth([]);
      return;
    }
    const min = new Date(minMs);
    const max = new Date(maxMs);
    const fullDateRange = getDateRange(min, max);

    const dailyTotals: Record<string, number> = {};
    const weeklyTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};

    for (const sale of sortedSales) {
      const commission = getCommissionForSale(sale, me?.commissionRate);
      const day = toEasternDate(sale.createdAt);
      const week = toWeekLabel(sale.createdAt);
      const month = toMonthLabel(sale.createdAt);

      dailyTotals[day] = (dailyTotals[day] || 0) + commission;
      weeklyTotals[week] = (weeklyTotals[week] || 0) + commission;
      monthlyTotals[month] = (monthlyTotals[month] || 0) + commission;
    }

    const dailyData: DataObj[] = fullDateRange.map((date) => ({
      x: date,
      y: Number((dailyTotals[date] || 0).toFixed(2)),
    }));

    const weeklyData: DataObj[] = Object.entries(weeklyTotals)
      .map(([week, total]) => ({ x: week, y: Number(total.toFixed(2)) }))
      .sort((a, b) => {
        const [_, weekA, yearA] = a.x.match(/Week (\d+), (\d+)/) || [];
        const [__, weekB, yearB] = b.x.match(/Week (\d+), (\d+)/) || [];
        return +yearA !== +yearB ? +yearA - +yearB : +weekA - +weekB;
      });

    const monthlyData: DataObj[] = Object.entries(monthlyTotals)
      .map(([month, total]) => ({ x: month, y: Number(total.toFixed(2)) }))
      .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

    setCommissionPerDay([{ id: "Commissions per day", data: dailyData }]);
    setCommissionsPerWeek([{ id: "Commissions per week", data: weeklyData }]);
    setCommissionsPerMonth([
      { id: "Commissions per month", data: monthlyData },
    ]);
  }, [salesData, me?.commissionRate]);

  useEffect(() => {
    if (data?.me) setMe(data.me);
  }, [data]);

  return { me, commissionPerDay, commissionsPerWeek, commissionsPerMonth };
}
