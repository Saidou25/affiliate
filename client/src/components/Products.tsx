import { useState } from "react";
import { products } from "../data/products";

import RefferalLink from "./RefferalLink";

import "./Products.css";

export type ProductLink = {
    productTitle: string;
    productUrl: string;
  };

export default function Products() {
  const [productsLinks, setProducstLinks] = useState<ProductLink[]
  >([]);

  const selectUrl = (url: string, productTitle: string) => {
    setProducstLinks((prev) => [...prev, { productTitle, productUrl: url }]);
  };
  const removeUrl = (productTitle: string) => {
    setProducstLinks((prev) =>
      prev.filter((prod) => prod.productTitle !== productTitle)
    );
  };

  return (
    <div className="products-container">
      <h2>Products' List</h2>
      <br />
      <ul>
        {products &&
          products.map((product) => (
            <li key={product.title} className="product-li">
              <img
                className="image-fluid"
                alt="product image"
                src={product.imageUrl ? product.imageUrl : undefined}
              />
              <div className="ps">
                <span>{product.subtitle}</span>
                <span>{product.description}</span>
                <span>{product.price}</span>
                {productsLinks?.some((prod) => prod.productTitle === product.title) &&
                <RefferalLink productUrl={product.url} />
                }
               
              </div>
             
                {productsLinks.some((prod) =>
                  prod.productTitle === product.title) ? (
                    <button
                      className=""
                      onClick={() => removeUrl(product.title)}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      className=""
                      onClick={() => selectUrl(product.url, product.title)}
                    >
                      Select
                    </button>
                  )
                }
            </li>
          ))}
      </ul>
    </div>
  );
}
