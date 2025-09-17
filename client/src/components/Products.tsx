import { useEffect, useState } from "react";
import { AffiliateProduct } from "../types";
import { useQuery } from "@apollo/client";
import { AFFILIATE_PRODUCTS } from "../utils/queries";
import DOMPurify from "dompurify";
import RefferalLink from "./RefferalLink";
import Button from "./Button";
import Banner from "./Banner";
import ReferralImage from "./ReferralImage";
import CopyToClipboard from "./CopyToClipboard";

import "./Products.css";

export type ProductLink = {
  productTitle: string;
  productUrl: string;
};

export default function Products() {
  const [productsLinks, setProducstLinks] = useState<ProductLink[]>([]);
  const [productsData, setProductsData] = useState<AffiliateProduct[]>([]);

  const {
    data: affiliateProductsData,
    loading,
    error,
    refetch,
  } = useQuery(AFFILIATE_PRODUCTS, {
    variables: { active: true },
    fetchPolicy: "cache-and-network",
  });
  // const error = "1";
  const selectUrl = (url: string, productTitle: string) => {
    setProducstLinks((prev) => [...prev, { productTitle, productUrl: url }]);
  };
  const removeUrl = (productTitle: string) => {
    setProducstLinks((prev) =>
      prev.filter((prod) => prod.productTitle !== productTitle)
    );
  };

  useEffect(() => {
    if (affiliateProductsData) {
      setProductsData(affiliateProductsData.affiliateProducts);
    }
  }, [affiliateProductsData]);

  function ProductsIntro() {
    const [open, setOpen] = useState(false);

    return (
      <section className="mb-3">
        <h2 className="mb-2">Promote &amp; Earn — Quick Start</h2>
        {/* <h3 className="mb-2 lead-intro">Quick Start, How to Promote & Get Credit, Getting Started.</h3> */}
        {/* <br /> */}
        <p className="mb-2 lead-intro">
          This page lists products, services, retreats, and coaching you can
          promote. Click <em>Select</em> on any item to generate your personal{" "}
          <em>Product link</em>, then copy and share it in your content
          (YouTube, website, social, email). Sales from your link are credited
          to you.
        </p>

        <button
          type="button"
          className="btn p-0 intro-toggle"
          aria-expanded={open}
          aria-controls="products-directions"
          onClick={() => setOpen((o) => !o)}
        >
          {open
            ? "Hide step-by-step directions"
            : "View step-by-step directions"}
        </button>

        <div
          id="products-directions"
          className={`intro-panel mt-2 ${open ? "show" : ""}`}
          aria-hidden={open ? "false" : "true"}
        >
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <ol className="m-0 ps-3">
                <li className="mb-2">
                  <strong>Browse items:</strong> Each card shows the title, a
                  short description, and the price.
                </li>
                <li className="mb-2">
                  <strong>Generate your link:</strong> Click <em>Select</em>. A{" "}
                  <em>Product link</em> appears with your <code>refId</code>.
                </li>
                <li className="mb-2">
                  <strong>Copy &amp; share:</strong> Use the <em>Copy</em>{" "}
                  button, then paste it on YouTube, your site/blog, social
                  profiles, or newsletters.
                </li>
                <li className="mb-0">
                  <strong>Track results:</strong> Your dashboard records clicks
                  and sales from your link.
                </li>
              </ol>

              <hr className="my-3" />

              <div className="small text-muted">
                <strong>Tips:</strong> Don’t edit or remove{" "}
                <code>?refId=…</code>. If you shorten the URL, ensure the query
                string is preserved. Want analytics? Append UTM tags after your
                refId (e.g.,
                <code>&amp;utm_source=youtube</code>). Always follow disclosure
                rules (e.g., “#ad”).
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="products-container">
        <Banner
          className="mb-3"
          variant="error"
          title="Something went wrong"
          message={error.message || "We couldn't load products."}
          action={{ label: "Try again", onClick: () => refetch() }}
          dismissible
        />
      </div>
    );
  }

  return (
    <div className="products-container">
      <ProductsIntro />
      <br />
      <h2>Products' List</h2>
      <br />

      {loading && !productsData?.length ? (
        // Skeleton while first load (still shows data if cache has it)
        <LoadingProductsSkeleton count={6} />
      ) : (
        <ul aria-live="polite">
          {productsData?.map((product) => (
            <li key={product.name} className="row g-0 product-li">
              <img
                className="col-5 col-sm-5 col-md-3 col-lg-2 image-fluid img-fluid"
                alt={`${product.name} image`}
                src={product.primaryImage ?? ""}
                loading="lazy"
              />

              <div className="col-12 col-sm-9 col-md-8 col-lg-7 ps">
                <h4 className="affiliate-product-title">{product.name}</h4>
                {(product.shortDescription || product.description) && (
                  <div
                    className="product-desc"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        product.shortDescription || product.description || ""
                      ),
                    }}
                  />
                )}
                <br />
                <span>${product.price}</span>
                {productsLinks?.some(
                  (p) => p.productTitle === product.name
                ) && (
                  <>
                    <RefferalLink productUrl={product.permalink} />

                    <br />
                    <ReferralImage imageUrl={product.primaryImage ?? ""}>
                      <CopyToClipboard
                        kind="image"
                        imageUrl={product.primaryImage!}
                      />
                    </ReferralImage>
                  </>
                )}
              </div>

              {productsLinks.some((p) => p.productTitle === product.name) ? (
                <Button
                  className="col-12 col-md-12 col-lg-2 col-xl-1 blue-btn"
                  onClick={() => removeUrl(product.name)}
                >
                  Unselect
                </Button>
              ) : (
                <Button
                  className="col-12 col-md-12 col-lg-2 col-xl-1 blue-btn"
                  onClick={() => selectUrl(product.permalink, product.name)}
                >
                  Select
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** ---------- UI: Loading Skeleton ---------- */

function LoadingProductsSkeleton({ count = 4 }: { count?: number }) {
  const items = Array.from({ length: count });
  return (
    <ul aria-hidden="true">
      {items.map((_, i) => (
        <li key={i} className="product-li">
          <div className="skeleton skeleton-img" />
          <div className="ps">
            <div className="skeleton skeleton-line skeleton-line--lg" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--sm" />
          </div>
          <div className="skeleton skeleton-btn" />
        </li>
      ))}
    </ul>
  );
}
