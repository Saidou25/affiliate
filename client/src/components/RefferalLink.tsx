import CopyToClipboard from "./CopyToClipboard";

interface Props {
  productUrl: string;
}

export default function RefferalLink({ productUrl }: Props) {
const refId = "LYwsXhFH"
  return (
    <div><br />
      <strong>Product link</strong><br />
      {productUrl}/?ref={refId}
      <CopyToClipboard productUrl={productUrl} />
    </div>
  );
}
