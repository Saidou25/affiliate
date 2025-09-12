import Stripe from "stripe";

type WithId = { id: string };

export function toStripeListPage<T extends WithId>(list: Stripe.ApiList<T>) {
  const last = list.data.length ? list.data[list.data.length - 1] : null;
  return {
    hasMore: list.has_more,
    nextCursor: last ? last.id : null, // used with starting_after
    data: list.data,
  };
}

// For search endpoints (charges.search, paymentIntents.search, refunds.search)
export function toStripeSearchPage<T>(res: Stripe.ApiSearchResult<T>) {
  return {
    hasMore: res.has_more,
    nextCursor: res.next_page ?? null, // used with `page` on next call
    data: res.data as any[],
  };
}

// Only include params supported by .list()
export const stripeFiltersToParams = (filter?: any) => {
  const params: Record<string, any> = {};
  if (!filter) return params;

  // created range is supported by most List endpoints
  if (filter.createdFrom || filter.createdTo) {
    params.created = {
      ...(filter.createdFrom ? { gte: filter.createdFrom } : {}),
      ...(filter.createdTo ? { lte: filter.createdTo } : {}),
    };
  }
  return params;
};

// Decide if we must use search (metadata/email/status need search)
export const needsSearch = (filter?: any) => {
  if (!filter) return false;
  return Boolean(filter.refId || filter.email || filter.status);
};

// Build a Stripe search query string safely
export const buildChargesSearchQuery = (filter?: any) => {
  const terms: string[] = [];
  if (!filter) return "";

  if (filter.refId)
    terms.push(`metadata['refId']:'${escapeVal(filter.refId)}'`);
  if (filter.email)
    terms.push(`billing_details.email:'${escapeVal(filter.email)}'`);
  if (filter.status) terms.push(`status:'${escapeVal(filter.status)}'`);
  if (filter.createdFrom) terms.push(`created>=${Number(filter.createdFrom)}`);
  if (filter.createdTo) terms.push(`created<=${Number(filter.createdTo)}`);

  return terms.join(" AND ");
};

export const buildPISearchQuery = (filter?: any) => {
  const terms: string[] = [];
  if (!filter) return "";
  if (filter.refId)
    terms.push(`metadata['refId']:'${escapeVal(filter.refId)}'`);
  if (filter.email) terms.push(`receipt_email:'${escapeVal(filter.email)}'`);
  if (filter.status) terms.push(`status:'${escapeVal(filter.status)}'`);
  if (filter.createdFrom) terms.push(`created>=${Number(filter.createdFrom)}`);
  if (filter.createdTo) terms.push(`created<=${Number(filter.createdTo)}`);
  return terms.join(" AND ");
};

function escapeVal(v: string) {
  // very light escaping; Stripe query language is simple but avoid stray quotes
  return String(v).replace(/'/g, "\\'");
}
