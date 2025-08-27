import fetch from "node-fetch";
import AffiliateProduct from "../models/AffiliateProduct";

type StoreImage = { src: string };
type StoreCategory = { slug: string };

type StorePrices = {
  price: string | null;
  currency_code: string | null;
  regular_price: string | null;
  sale_price: string | null;
};

type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string; // "simple" | "variable" | etc.
  prices: StorePrices;
  is_in_stock: boolean;
  images: StoreImage[];
  categories: StoreCategory[];
  date_modified: string; // ISO
};

const toNum = (v: string | null) =>
  v == null ? null : Number.isFinite(Number(v)) ? Number(v) / 100 : null;

function mapStoreProduct(p: StoreProduct) {
  const price = toNum(p.prices?.price ?? null);
  const regularPrice = toNum(p.prices?.regular_price ?? null);
  const salePrice = toNum(p.prices?.sale_price ?? null);
  const currency = p.prices?.currency_code ?? null;

  return {
    wooId: p.id,
    slug: p.slug,
    name: p.name,
    permalink: p.permalink,
    price,
    currency,
    onSale: salePrice != null && regularPrice != null && salePrice < regularPrice,
    regularPrice,
    salePrice,
    stockStatus: p.is_in_stock ? "in_stock" : "out_of_stock",
    primaryImage: p.images?.[0]?.src ?? null,
    categorySlugs: (p.categories || []).map(c => c.slug).filter(Boolean),
    updatedAt: new Date(p.date_modified || Date.now()),
    hasOptions: p.type === "variable",
    active: true,
  };
}

export async function refreshWooProductsOnce(opts: {
  baseUrl: string;       // e.g. https://yourshop.com
  perPage?: number;      // default 100
  notes?: string[];
}) {
  const notes: string[] = opts.notes ?? [];
  const perPage = Math.min(Math.max(opts.perPage ?? 100, 1), 100);

  let page = 1;
  let totalFetched = 0;
  let created = 0;
  let updated = 0;

  // track seen ids to inactivate missing later
  const seen = new Set<number>();

  while (true) {
    const url = new URL(`/wp-json/wc/store/v1/products`, opts.baseUrl);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    // parent products only; Store API excludes variation children by default

    const res = await fetch(url.toString(), { timeout: 20000 } as any);
    if (!res.ok) {
      throw new Error(`Store API ${res.status}: ${await res.text()}`);
    }

    const arr = (await res.json()) as StoreProduct[];
    if (!Array.isArray(arr) || arr.length === 0) break;

    for (const pr of arr) {
      const doc = mapStoreProduct(pr);
      seen.add(doc.wooId);
      totalFetched++;

      const existing = await AffiliateProduct.findOne({ wooId: doc.wooId });
      if (!existing) {
        await AffiliateProduct.create(doc);
        created++;
      } else {
        // compute minimal diff to avoid useless writes
        const changed =
          existing.slug !== doc.slug ||
          existing.name !== doc.name ||
          existing.permalink !== doc.permalink ||
          existing.price !== doc.price ||
          existing.currency !== doc.currency ||
          existing.onSale !== doc.onSale ||
          existing.regularPrice !== doc.regularPrice ||
          existing.salePrice !== doc.salePrice ||
          existing.stockStatus !== doc.stockStatus ||
          existing.primaryImage !== doc.primaryImage ||
          existing.hasOptions !== doc.hasOptions ||
          existing.active !== true ||
          JSON.stringify(existing.categorySlugs) !== JSON.stringify(doc.categorySlugs) ||
          existing.updatedAt.getTime() !== doc.updatedAt.getTime();

        if (changed) {
          existing.set({ ...doc, active: true });
          await existing.save();
          updated++;
        } else if (existing.active !== true) {
          existing.active = true;
          await existing.save();
          updated++;
        }
      }
    }

    page++;
  }

  // Inactivate products not seen in this run
  const result = await AffiliateProduct.updateMany(
    { active: true, wooId: { $nin: Array.from(seen) } },
    { $set: { active: false, modifiedAt: new Date() } }
  );
  const inactivated = result.modifiedCount ?? 0;

  notes.push(`Seen ${seen.size} unique products.`);

  return {
    ok: true,
    totalFetched,
    created,
    updated,
    inactivated,
    finishedAt: new Date(),
    notes,
  };
}
