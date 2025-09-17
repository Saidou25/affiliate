import { useState } from "react";
import { FaRegClipboard, FaClipboardCheck } from "react-icons/fa";

type CopyProps =
  | { kind: "product"; productUrl: string; refId: string }
  | { kind: "image"; imageUrl: string };

const CopyToClipboard = (props: CopyProps) => {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    let text = "";

    if (props.kind === "product") {
      const u = new URL(props.productUrl);
      // Append or update ?refId=...
      u.searchParams.set("refId", props.refId);
      text = u.toString();
    } else {
      text = props.imageUrl;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{ cursor: "pointer", background: "none", border: "none" }}
    >
      {copied ? <FaClipboardCheck color="green" /> : <FaRegClipboard />}
    </button>
  );
};

export default CopyToClipboard;
