import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { QUERY_ME } from "../utils/queries";
import SettingsLeftBar, { SettingsItem, SettingsKey } from "./SettingsLeftBar";
import StripeStatusCard from "./StripStatusCard";
import Profile from "./Profile";
import Button from "./Button";

import "./SettingsLeftBar.css";
import "./SettingsLayout.css";

export default function Settings() {
  const { data, loading } = useQuery(QUERY_ME);
  const me = data?.me || {};
  const navigate = useNavigate();

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

  const [current, setCurrent] = useState<SettingsKey>("account");
  const currentLabel =
    items.find((i) => i.key === current)?.label ?? "Settings";

  if (loading) return <p>Loading settings...</p>;

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
          className="col-12 col-md-8 col-lg-9 settings-content"
          aria-live="polite"
        >
          <header className="settings-content__header">
            <h2>{currentLabel}</h2>
            <div className="label-underline" />
          </header>

          {current === "account" && (
            <section className="settings-card">
              <StripeStatusCard affiliateId={me.id} />
            </section>
          )}

          {current === "profile" && (
            <section className="settings-card">
              {/* <h3>Profile</h3> */}
              <Profile />
              {/* <div className="settings-actions">
                <Button
                  onClick={() => navigate("/affiliate/profile")}
                  className="blue-btn-profile"
                >
                  Edit Profile
                </Button>
              </div> */}
            </section>
          )}

          {current === "notifications" && (
            <section className="settings-card">
              {/* <h3>Notifications</h3> */}
              <p>
                You’ll be notified here about your affiliate sales, commission
                payments, and system updates.
              </p>
              <div className="settings-actions">
                <Button
                  onClick={() => navigate("/affiliate/notifications")}
                  className="blue-btn"
                >
                  View Notifications
                </Button>
              </div>
            </section>
          )}

          {current === "payouts" && (
            <section className="settings-card">
              {/* <h3>Payouts</h3> */}
              <p>
                Manage payout methods, schedule preferences, and tax documents.
              </p>
            </section>
          )}

          {current === "security" && (
            <section className="settings-card">
              {/* <h3>Security</h3> */}
              <ul className="settings-list">
                <li>Change password</li>
                <li>Two-factor authentication</li>
                <li>Active sessions</li>
              </ul>
            </section>
          )}

          {current === "connections" && (
            <section className="settings-card">
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
