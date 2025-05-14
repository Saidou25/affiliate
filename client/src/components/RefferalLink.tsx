import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import CopyToClipboard from "./CopyToClipboard";

interface Props {
  productUrl: string;
}

export default function RefferalLink({ productUrl }: Props) {
    const { data: meData } = useQuery(QUERY_ME);
    const me = meData?.me || [];
const refId = me.refId;
  return (
    <div><br />
      <strong>Product link</strong><br />
      {productUrl}/?ref={refId}
      <CopyToClipboard productUrl={productUrl} 
      refId={refId} />
    </div>
  );
}
