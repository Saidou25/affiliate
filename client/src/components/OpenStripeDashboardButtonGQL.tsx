// client/components/OpenStripeDashboardButtonGQL.tsx
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_STRIPE_EXPRESS_LOGIN_LINK } from "../utils/mutations";

type Props = {
  refId?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export default function OpenStripeDashboardButtonGQL({
  refId,
  className,
  label = "Open Stripe Dashboard",
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [createLink] = useMutation(CREATE_STRIPE_EXPRESS_LOGIN_LINK);

  const onClick = async () => {
    if (!refId || loading) return;
    setLoading(true);
    try {
      const { data } = await createLink({ variables: { refId } });
      const url: string | undefined = data?.createStripeExpressDashboardLink?.url;
      if (!url) throw new Error("No URL returned");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Could not open Stripe Dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || loading || !refId}
      aria-busy={loading}
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
