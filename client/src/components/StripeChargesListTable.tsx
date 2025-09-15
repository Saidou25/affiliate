import { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";

import "./StripeChargesListTable.css";

const STRIPE_CHARGES = gql`
  query StripeCharges($after: String, $limit: Int, $filter: StripeListFilter) {
    stripeCharges(after: $after, limit: $limit, filter: $filter) {
      hasMore
      nextCursor
      data
    }
  }
`;

type StripeCharge = {
  id: string;
  amount: number; // in cents
  currency: string;
  status: "succeeded" | "pending" | "failed" | "canceled" | "refunded";
  paid?: boolean;
  refunded?: boolean;
  captured?: boolean;
  created: number; // epoch seconds
  description?: string | null;
  receipt_url?: string | null;
  balance_transaction?: {
    id: string;
    fee?: number; // cents
    net?: number; // cents
  } | null;
  billing_details?: {
    email?: string | null;
    name?: string | null;
  } | null;
  metadata?: Record<string, any> | null;
  payment_intent?: string | null;
};

type StripeListPage = {
  hasMore: boolean;
  nextCursor?: string | null;
  data: StripeCharge[];
};

type QueryData = {
  stripeCharges: StripeListPage;
};

type FilterState = {
  createdFrom?: string; // yyyy-mm-dd
  createdTo?: string; // yyyy-mm-dd
  status?: string;
  email?: string;
  refId?: string;
};

const cents = (n?: number) => (typeof n === "number" ? n : 0);
const money = (centsValue: number, currency = "usd") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "symbol",
  }).format((centsValue || 0) / 100);

const dateStr = (epochSec: number) =>
  new Date(epochSec * 1000).toLocaleString();

const toEpoch = (yyyyMmDd?: string) => {
  if (!yyyyMmDd) return undefined;
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  return Math.floor(d.getTime() / 1000);
};

export default function StripeChargesListTable() {
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<FilterState>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const variables = useMemo(() => {
    const f: any = {};
    if (filter.createdFrom || filter.createdTo) {
      f.createdFrom = toEpoch(filter.createdFrom);
      // end-of-day for createdTo
      if (filter.createdTo) {
        const end = new Date(`${filter.createdTo}T23:59:59`);
        f.createdTo = Math.floor(end.getTime() / 1000);
      }
    }
    if (filter.status) f.status = filter.status;
    if (filter.email) f.email = filter.email.trim();
    if (filter.refId) f.refId = filter.refId.trim();
    return { after, limit: 25, filter: Object.keys(f).length ? f : undefined };
  }, [after, filter]);

  const { data, loading, error, refetch, fetchMore } = useQuery<QueryData>(
    STRIPE_CHARGES,
    {
      variables,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    }
  );

  const rows = data?.stripeCharges.data ?? [];
  const nextCursor = data?.stripeCharges.nextCursor ?? null;
  const hasMore = data?.stripeCharges.hasMore ?? false;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAfter(undefined);
    refetch(variables);
  };

  const clearFilters = () => {
    setFilter({});
    setAfter(undefined);
  };

  const loadMore = async () => {
    if (!hasMore || !nextCursor) return;
    const res = await fetchMore({
      variables: { ...variables, after: nextCursor },
    });
    setAfter(res.data?.stripeCharges?.nextCursor ?? undefined);
  };

  return (
    <div className="sc-wrap">
      <header className="sc-header">
        <div>
          <h2 className="sc-title">Stripe — Charges</h2>
          <p className="sc-subtitle">
            Source-of-truth view for payments. Filter, inspect, and reconcile.
          </p>
        </div>
        <div className="sc-actions">
          <button
            className="sc-btn"
            onClick={() => refetch(variables)}
            disabled={loading}
            title="Refresh"
          >
            ⟲ Refresh
          </button>
        </div>
      </header>

      <form className="sc-filters" onSubmit={onSearch}>
        <div className="sc-filter-row">
          <label>
            From
            <input
              type="date"
              value={filter.createdFrom ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  createdFrom: e.target.value || undefined,
                }))
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filter.createdTo ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  createdTo: e.target.value || undefined,
                }))
              }
            />
          </label>
          <label>
            Status
            <select
              value={filter.status ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  status: e.target.value || undefined,
                }))
              }
            >
              <option value="">Any</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="canceled">Canceled</option>
              <option value="captured">Captured</option>
            </select>
          </label>
          <label>
            Email
            <input
              type="email"
              placeholder="customer@email.com"
              value={filter.email ?? ""}
              onChange={(e) =>
                setFilter((f) => ({ ...f, email: e.target.value || undefined }))
              }
            />
          </label>
          <label>
            refId
            <input
              type="text"
              placeholder="e.g. bboWa9LP"
              value={filter.refId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({ ...f, refId: e.target.value || undefined }))
              }
            />
          </label>
        </div>
        <div className="sc-filter-actions">
          <button
            className="sc-btn sc-primary"
            type="submit"
            disabled={loading}
          >
            Search
          </button>
          <button
            className="sc-btn sc-ghost"
            type="button"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="sc-error">
          <strong>Failed to load charges:</strong> {error.message}
        </div>
      )}

      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Charge</th>
              <th>Amount</th>
              <th>Net</th>
              <th>Status</th>
              <th>Email</th>
              <th>refId</th>
              <th>PI</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ch) => {
              const isExpanded = expanded === ch.id;
              const net = cents(ch.balance_transaction?.net);
              const fee = cents(ch.balance_transaction?.fee);
              const amount = cents(ch.amount);
              const currency = ch.currency || "usd";
              const refId =
                ch.metadata?.refId ??
                ch.metadata?.RefId ??
                ch.metadata?.REFID ??
                "";
              const stripeDash = `https://dashboard.stripe.com/${
                import.meta.env.PROD ? "" : "test/"
              }payments/${ch.id}`;

              const status = ch.refunded ? "refunded" : ch.status;

              return (
                <>
                  <tr
                    key={ch.id}
                    className={`sc-row ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpanded(isExpanded ? null : ch.id)}
                  >
                    <td>{dateStr(ch.created)}</td>
                    <td className="mono">{ch.id}</td>
                    <td>{money(amount, currency)}</td>
                    <td title={`Fee: ${money(fee, currency)}`}>
                      {net ? money(net, currency) : "—"}
                    </td>
                    <td>
                      <span className={`pill pill--${status}`}>{status}</span>
                    </td>
                    <td title={ch.billing_details?.name || ""}>
                      {ch.billing_details?.email || "—"}
                    </td>
                    <td className="mono">{refId || "—"}</td>
                    <td className="mono">{ch.payment_intent || "—"}</td>
                    <td
                      className="sc-links"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ch.receipt_url && (
                        <a
                          href={ch.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Receipt
                        </a>
                      )}
                      <a href={stripeDash} target="_blank" rel="noreferrer">
                        Stripe
                      </a>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="sc-expand">
                      <td colSpan={9}>
                        <div className="sc-expand-grid">
                          <div>
                            <h4>Details</h4>
                            <ul className="sc-kv">
                              <li>
                                <span>Captured</span>
                                <code>{String(ch.captured ?? false)}</code>
                              </li>
                              <li>
                                <span>Paid</span>
                                <code>{String(ch.paid ?? false)}</code>
                              </li>
                              <li>
                                <span>Refunded</span>
                                <code>{String(ch.refunded ?? false)}</code>
                              </li>
                              <li>
                                <span>Balance Txn</span>
                                <code>{ch.balance_transaction?.id ?? "—"}</code>
                              </li>
                              <li>
                                <span>Description</span>
                                <code>{ch.description || "—"}</code>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4>Metadata</h4>
                            <pre className="sc-pre">
                              {JSON.stringify(ch.metadata ?? {}, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4>Raw JSON</h4>
                            <pre className="sc-pre">
                              {JSON.stringify(ch, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="sc-empty">
                  No charges found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sc-pagination">
        <button
          className="sc-btn sc-ghost"
          onClick={loadMore}
          disabled={!hasMore || loading}
        >
          {loading ? "Loading…" : hasMore ? "Load more" : "No more results"}
        </button>
      </div>
    </div>
  );
}
