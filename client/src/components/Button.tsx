import { CSSProperties, ReactNode } from "react";

import "./Button.css";

type ButtonProps = {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  // ReactNode covers strings, numbers, JSX, fragments, arrays of elements, etc.*}
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  className,
  onClick,
  children,
  style,
  disabled,
  type,
}: ButtonProps) {
  return (
    <button
      className={className}
      onClick={onClick}
      style={style}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}
