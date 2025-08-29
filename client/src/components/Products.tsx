import { useEffect, useState } from "react";
import RefferalLink from "./RefferalLink";
import Button from "./Button";
import { AffiliateProduct } from "../types";
import { useQuery } from "@apollo/client";
import { AFFILIATE_PRODUCTS } from "../utils/queries";

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
    // loading: affiliateProductsDataLoading,
    // error: affiliateProductsDataError,
  } = useQuery(AFFILIATE_PRODUCTS, {
    variables: { active: true }, // or rely on a schema default if you set one
  });

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

  return (
    <div className="products-container">
      <h2>Products' List</h2>
      <br />
      {/* Look into organizing per category */}
      <ul>
        {productsData &&
          productsData.map((product) => (
            <li key={product.name} className="product-li">
              <img
                className="image-fluid"
                alt="product image"
                src={product.primaryImage ? product.primaryImage : undefined}
              />
              <div className="ps">
                <h4 className="affiliate-product-title">{product.name}</h4>
                <span>
                  Some descriptions (brief text) go here... Also an option to
                  open unique detail page for that item.
                </span>
                <br />
                <span>${product.price}</span>
                {productsLinks?.some(
                  (prod) => prod.productTitle === product.name
                ) && <RefferalLink productUrl={product.permalink} />}
              </div>
              {productsLinks.some(
                (prod) => prod.productTitle === product.name
              ) ? (
                <Button
                  className="blue-btn"
                  onClick={() => removeUrl(product.name)}
                  style={{ height: "40px", width: "90px" }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  className="blue-btn"
                  onClick={() => selectUrl(product.permalink, product.name)}
                  style={{ height: "40px", width: "90px" }}
                >
                  Select
                </Button>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
