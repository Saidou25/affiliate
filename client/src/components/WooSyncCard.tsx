import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { REFRESH_WOO_PRODUCTS } from "../utils/mutations";
import { AFFILIATE_PRODUCTS } from "../utils/queries";
import { AffiliateProduct } from "../types";

import "./WooSyncCard.css";

export default function WooSyncCard({
  defaultBaseUrl = "https://store.newearthcivilization.com/",
}: {
  defaultBaseUrl?: string;
}) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [perPage, setPerPage] = useState(100);
  const [productsData, setProductsData] = useState<AffiliateProduct[]>([]);

  const {
    data: affiliateProductsData,
    loading: affiliateProductsDataLoading,
    error: affiliateProductsDataError,
  } = useQuery(AFFILIATE_PRODUCTS, {
    variables: { active: true }, // or rely on a schema default if you set one
  });
  console.log(affiliateProductsData);

  const [refresh, { data, loading, error }] = useMutation(REFRESH_WOO_PRODUCTS);

  const onRun = async () => {
    await refresh({ variables: { baseUrl, perPage, active: true } });
  };

  useEffect(() => {
    console.log(affiliateProductsData);
    if (affiliateProductsData) {
      console.log(affiliateProductsData);
      setProductsData(affiliateProductsData.affiliateProducts);
    }
  }, [affiliateProductsData]);

  return (
    <>
      <div className="refresh-tool rounded-2xl p-4 border">
        <h3 className="text-lg font-semibold mb-2">
          Refresh Woo Products (manual)
        </h3>
        <br />
        <div className="refresh-card flex gap-2 items-end mb-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Woo Base URL:&nbsp;</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://shop.example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Per Page:&nbsp;</label>
            <input
              type="number"
              min={1}
              max={100}
              className="w-24 border rounded px-2 py-1"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value || 100))}
            />
          </div>
          <br />
          <button
            onClick={onRun}
            disabled={loading}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          >
            {loading ? "Syncing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-2">{error.message}</div>
        )}

        {data?.refreshWooProducts && (
          <div className="text-sm space-y-1">
            <div>
              ✅ <b>OK:</b> {String(data.refreshWooProducts.ok)}
            </div>
            <div>Total fetched: {data.refreshWooProducts.totalFetched}</div>
            <div>Created: {data.refreshWooProducts.created}</div>
            <div>Updated: {data.refreshWooProducts.updated}</div>
            <div>Inactivated: {data.refreshWooProducts.inactivated}</div>
            <div>
              Finished at:{" "}
              {new Date(data.refreshWooProducts.finishedAt).toLocaleString()}
            </div>
            {data.refreshWooProducts.notes?.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">Notes</summary>
                <ul className="list-disc ml-5">
                  {data.refreshWooProducts.notes.map((n: string, i: number) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="affiliate-products-container">
        {affiliateProductsDataLoading && <p>Loading data...</p>}
        {affiliateProductsDataError && (
          <p>{affiliateProductsDataError.message}</p>
        )}
        <div className="products-container">
          <h2>Products' List</h2>
          <br />
          <ul>
            {productsData &&
              productsData.map((item, index: number) => (
                <li key={index} className="product-li-admin">
                  <img
                    className="image-fluid"
                    alt="product image"
                    src={item.primaryImage ? item.primaryImage : undefined}
                  />
                  <div className="ps">
                    <span>
                      <strong className="admin-product-titles">
                        product name -
                      </strong>
                      &nbsp;{item.name}
                    </span>
                    <span>
                      <strong className="admin-product-titles">woo id -</strong>
                      &nbsp;{item.wooId}
                    </span>
                    <span>
                      <strong className="admin-product-titles">price -</strong>
                      &nbsp;${item.price}
                    </span>
                    <strong className="admin-product-titles">
                      Description -
                    </strong>
                    {/* NEW: description preview */}
                    {(item.shortDescription || item.description) && (
                      <div
                        className="product-desc"
                        dangerouslySetInnerHTML={{
                          __html:
                            (item.shortDescription as unknown as string) ||
                            (item.description as unknown as string),
                        }}
                      />
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}
