import { useState } from "react";
import { FaRegClipboard, FaClipboardCheck } from "react-icons/fa"; // Example icons

type Props = {
    productUrl: string;
};

const CopyToClipboard = ({ productUrl }: Props) => {
  const [copied, setCopied] = useState(false);
const refId = "LYwsXhFH"
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${productUrl}/?ref=${refId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
