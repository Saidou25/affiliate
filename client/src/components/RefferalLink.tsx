import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import CopyToClipboard from "./CopyToClipboard";

import "./ReferralLink.css";

interface Props {
  productUrl: string;
}

export default function RefferalLink({ productUrl }: Props) {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || [];
  const refId = me.refId;
  return (
    <>
      <br />
      <strong className="product-link-title">Product link</strong>
      <div className="product-link">
        <span className="product-link__url">
          {productUrl}?refId={refId}
        </span>
        <CopyToClipboard kind="product" productUrl={productUrl} refId={refId} />
      </div>
    </>
  );
}
