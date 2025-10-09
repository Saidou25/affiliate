import { useEffect, useMemo, useRef, useState } from "react";
import SettingsLeftBar, { SettingsItem, SettingsKey } from "./SettingsLeftBar";
import StripeStatusCard from "./StripeStatusCard";
import Profile from "./Profile";
// import Button from "./Button";
import NotificationsList from "./NotificationsList";
import { AffiliateOutletContext } from "./AffiliateDashboard";
import { useOutletContext } from "react-router-dom";

import "./SettingsLeftBar.css";
import "./SettingsLayout.css";

export default function Settings() {
  const { affiliateId, refId, onboardingStatus } =
    useOutletContext<AffiliateOutletContext>();

  const [current, setCurrent] = useState<SettingsKey>("account");

  const ref = useRef<HTMLHeadingElement>(null);

  const items = useMemo<SettingsItem[]>(
    () => [
      { key: "account", label: "Account" },
      { key: "profile", label: "Profile" },
      { key: "notifications", label: "Notifications" },
      { key: "payouts", label: "Payouts" },
      { key: "security", label: "Security" },
      { key: "connections", label: "Connected Apps" }, // (typo note: you had "Stipe Connection" in defaults)
    ],
    []
  );

  const currentLabel =
    items.find((i) => i.key === current)?.label ?? "Settings";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("pg-fade-in");
    void el.offsetWidth; // force reflow
    el.classList.add("pg-fade-in"); // re-add to restart animation
  }, [currentLabel]);

  if (onboardingStatus?.loading) return <p>Loading settings...</p>;

  return (
    <div className="container-fluid settings-layout">
      <div className="row">
        {/* Sidebar column: full width on mobile, fixed rail on md+ */}
        <div className="col-12 col-md-4 col-lg-3 settings-sidebar-col">
          <SettingsLeftBar
            title="Settings"
            current={current}
            onSelect={setCurrent}
            items={items}
            footer={<span>v1.0</span>}
          />
        </div>

        {/* Content column */}
        <main
          className="col-12 col-md-8 col-lg-9 settings-content pg-fade-in"
          aria-live="polite"
        >
          <header
            key={currentLabel}
            className="settings-content__header pg-fade-in"
          >
            <h2 ref={ref} className="pg-fade-in">
              {currentLabel}
            </h2>
            <div className="label-underline" />
          </header>

          {current === "account" && (
            <section className="settings-card pg-fade-in">
              <StripeStatusCard
                refId={refId}
                affiliateId={affiliateId}
                onboardingStatus={onboardingStatus}
              />
            </section>
          )}

          {current === "profile" && (
            <section className="settings-card pg-fade-in">
              <Profile />
            </section>
          )}

          {current === "notifications" && (
            <section className="settings-card pg-fade-in">
              {/* <h3>Notifications</h3> */}
              {/* <p>
                You’ll be notified here about your affiliate sales, commission
                payments, and system updates.
              </p>
              <div className="settings-actions pg-fade-in">
                <Button
                  onClick={() => navigate("/affiliate/notifications")}
                  className="blue-btn"
                >
                  View Notifications
                </Button>
              </div> */}
              <NotificationsList />
            </section>
          )}

          {current === "payouts" && (
            <section className="settings-card pg-fade-in">
              {/* <h3>Payouts</h3> */}
              <p>
                Manage payout methods, schedule preferences, and tax documents.
              </p>
            </section>
          )}

          {current === "security" && (
            <section className="settings-card pg-fade-in">
              {/* <h3>Security</h3> */}
              <ul className="settings-list">
                <li>Change password</li>
                <li>Two-factor authentication</li>
                <li>Active sessions</li>
              </ul>
            </section>
          )}

          {current === "connections" && (
            <section className="settings-card pg-fade-in">
              {/* <h3>Connected Apps</h3> */}
              <p>
                Connect or disconnect integrations (Stripe, WooCommerce, etc.).
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
