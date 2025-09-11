import Stripe from "stripe";

type WithId = { id: string };

export function toStripeListPage<T extends WithId>(list: Stripe.ApiList<T>) {
  const last = list.data.length ? list.data[list.data.length - 1] : null;
  return {
    hasMore: list.has_more,
    nextCursor: last ? last.id : null,
    data: list.data, // forward as JSON for now
  };
}

export const stripeFiltersToParams = (filter?: any) => {
  const params: Record<string, any> = {};
  if (!filter) return params;

  if (filter.createdFrom || filter.createdTo) {
    params.created = {
      ...(filter.createdFrom ? { gte: filter.createdFrom } : {}),
      ...(filter.createdTo ? { lte: filter.createdTo } : {}),
    };
  }
  // NOTE: List endpoints (e.g., charges.list) do NOT support filtering by metadata/email.
  // Use search endpoints in your resolver when refId/email is provided.
  if (filter.status) params.status = filter.status;

  return params;
};
