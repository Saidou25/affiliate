import CopyToClipboard from "./CopyToClipboard";

interface Props {
  productUrl: string;
}

export default function RefferalLink({ productUrl }: Props) {
const refId = "LYwsXhFH"
  return (
    <div>
      {productUrl}/?ref={refId}
      <CopyToClipboard productUrl={productUrl} />
    </div>
  );
}
