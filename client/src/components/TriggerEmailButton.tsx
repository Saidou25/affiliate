import { useEffect } from "react";
import { useSendEmail } from "../hooks/useSendEmail";
import { SendEmailArgs } from "../types";

type Props = SendEmailArgs & {
  onSent: () => void;
  onLoading?: (loading: boolean) => void;
};

export default function TriggerEmailButton(props: Props) {
  const { affiliateEmail, title, refId, text, onSent, onLoading } = props;

  const { loading } = useSendEmail({
    args: { affiliateEmail, title, refId, text },
    trigger: true,
    onSuccess: () => {
      alert("✅ Email sent!");
      onSent();
    },
    onError: () => {
      alert("❌ Failed to send email.");
      onSent(); // still reset trigger
    },
  });
  // notify parent
  useEffect(() => {
    onLoading?.(loading);
  }, [loading]);

  return null; // hidden component, no visible UI
}
