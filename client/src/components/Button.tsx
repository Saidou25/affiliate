// Button.tsx
import { CSSProperties, ReactNode } from "react";
import "./Button.css";

type ButtonProps = {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  title?: string; // <- tooltip text
};

export default function Button({
  className,
  onClick,
  children,
  style,
  disabled,
  type,
  title,
}: ButtonProps) {
  return (
    <button
      className={className}
      onClick={onClick}
      style={style}
      disabled={disabled}
      type={type ?? "button"}   // (nice-to-have) default to "button"
      title={title}             // ✅ forward title so hover tooltip shows
    >
      {children}
    </button>
  );
}
