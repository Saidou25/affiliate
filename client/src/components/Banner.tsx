import { useId, useState } from "react";
import "./Banner.css";

export type BannerVariant = "error" | "warning" | "info" | "success";

type BannerAction = {
  label: string;
  onClick: () => void;
};

type Props = {
  variant?: BannerVariant;
  title: string;
  message?: string;
  action?: BannerAction;
  dismissible?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
  ariaLive?: "polite" | "assertive";
  role?: "alert" | "status";
  className?: string; // optional extra classes (e.g., Bootstrap spacing)
};

const DEFAULT_ICONS: Record<BannerVariant, React.ReactNode> = {
  error: "⚠️",
  warning: "⚠️",
  info: "ℹ️",
  success: "✅",
};

export default function Banner({
  variant = "info",
  title,
  message,
  action,
  dismissible = false,
  onClose,
  icon,
  compact = false,
  ariaLive,
  role,
  className = "",
}: Props) {
  const [hidden, setHidden] = useState(false);
  const descId = useId();
  if (hidden) return null;

  const computedRole =
    role ?? (variant === "error" || variant === "warning" ? "alert" : "status");
  const computedAriaLive =
    ariaLive ?? (computedRole === "alert" ? "assertive" : "polite");

  const handleClose = () => {
    setHidden(true);
    onClose?.();
  };

  return (
    <div
      className={`pg-banner pg-banner--${variant} ${
        compact ? "pg-banner--compact" : ""
      } ${className}`}
      role={computedRole}
      aria-live={computedAriaLive}
      aria-describedby={message ? descId : undefined}
    >
      <div className="pg-banner__icon" aria-hidden>
        {icon ?? DEFAULT_ICONS[variant]}
      </div>

      <div className="pg-banner__content">
        <strong className="pg-banner__title">{title}</strong>
        {message && (
          <div id={descId} className="pg-banner__message">
            {message}
          </div>
        )}
      </div>

      {action && (
        <button
          className="pg-banner__action btn"
          type="button"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}

      {dismissible && (
        <button
          className="pg-banner__close btn"
          type="button"
          aria-label="Dismiss"
          onClick={handleClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
