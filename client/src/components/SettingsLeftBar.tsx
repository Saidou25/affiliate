import { ReactNode, useEffect, useMemo, useRef } from "react";
import { IconType } from "react-icons";
import { FiUser, FiCreditCard, FiBell, FiShield, FiLink2 } from "react-icons/fi";

import "./SettingsLeftBar.css";

export type SettingsKey =
  | "account"
  | "profile"
  | "notifications"
  | "payouts"
  | "security"
  | "connections";

export type SettingsItem = {
  key: SettingsKey;
  label: string;
  icon?: IconType;
};

type SettingsLeftBarProps = {
  /** Current selected settings section key */
  current: SettingsKey;
  /** Called when the user selects an item */
  onSelect: (key: SettingsKey) => void;
  /** Optional custom items; if omitted, a sensible default set is shown */
  items?: SettingsItem[];
  /** Optional top title above the list */
  title?: string;
  /** Optional: render a small element below the list (e.g., version) */
  footer?: ReactNode;
};

const DEFAULT_ITEMS: SettingsItem[] = [
  { key: "account", label: "Account", icon: FiUser },
  { key: "profile", label: "Profile", icon: FiUser },
  { key: "notifications", label: "Notifications", icon: FiBell },
  { key: "payouts", label: "Payouts", icon: FiCreditCard },
  { key: "security", label: "Security", icon: FiShield },
  { key: "connections", label: "Stipe Connection", icon: FiLink2 },
];

export default function SettingsLeftBar({
  current,
  onSelect,
  items,
  title = "Settings",
//   footer,
}: SettingsLeftBarProps) {
  const list = useMemo(() => items ?? DEFAULT_ITEMS, [items]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Make the selected item visible if the list scrolls
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLButtonElement>(
      `button[data-key="${current}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <aside className="leftbar-settings" aria-label="Settings navigation">
      <div className="leftbar-settings__inner" ref={containerRef}>
        <h3 className="leftbar-settings__title">{title}</h3>
        <nav className="leftbar-settings__nav" role="navigation">
          <ul>
            {list.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  className={`leftbar-settings__item ${
                    current === key ? "is-active" : ""
                  }`}
                  data-key={key}
                  aria-current={current === key ? "page" : undefined}
                  onClick={() => onSelect(key)}
                >
                  {Icon ? <Icon className="leftbar-settings__icon" /> : null}
                  <span className="leftbar-settings__label">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {/* {footer ? <div className="leftbar-settings__footer">{footer}</div> : null} */}
      </div>
    </aside>
  );
}
