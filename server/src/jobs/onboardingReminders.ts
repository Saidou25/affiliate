import cron from "node-cron";
import Stripe from "stripe";
import Affiliate from "../models/Affiliate";
import { createReminder } from "../services/notifications/onboarding";
import { TITLES, REMINDER_PREFIX } from "../constants/onboarding";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type State = "not_started" | "in_progress" | "complete";

function mapStripeToState(acct: Stripe.Account | null): State {
  if (!acct) return "not_started";
  const due = acct.requirements?.currently_due ?? [];
  const complete =
    (acct.charges_enabled && acct.payouts_enabled) ||
    (due.length === 0 && acct.details_submitted);
  return complete ? "complete" : "in_progress";
}

function lastNoticeDateForState(
  notifications: { title: string; date: Date }[],
  state: Exclude<State, "complete">
) {
  const base = TITLES[state];
  const isMatch = (t: string) =>
    t === base || t === `${REMINDER_PREFIX}${base}`;
  let latest: Date | null = null;
  for (const n of notifications) {
    if (isMatch(n.title)) {
      const d = new Date(n.date);
      if (!latest || d > latest) latest = d;
    }
  }
  return latest;
}

function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

async function runLoopOnce() {
  const affiliates = await Affiliate.find(
    {},
    { refId: 1, stripeAccountId: 1, notifications: 1 }
  ).lean();

  for (const aff of affiliates) {
    try {
      // Determine current state
      let acct: Stripe.Account | null = null;
      if (aff.stripeAccountId) {
        try {
          acct = await stripe.accounts.retrieve(aff.stripeAccountId);
        } catch {
          acct = null;
        }
      }
      const state = mapStripeToState(acct);
      if (state === "complete") continue;

      // Find last notice (initial or reminder) for that state
      const last = lastNoticeDateForState(
        (aff.notifications ?? []).map((n: any) => ({
          title: n.title,
          date: new Date(n.date),
        })),
        state
      );

      const now = new Date();

      // Rule: send if never sent OR last ≥ 7 days ago
      if (!last || diffDays(now, last) >= 7) {
        await createReminder(aff.refId, state); // duplicates allowed by design
        console.log(`[CRON] reminder → ${aff.refId} state=${state}`);
      }
    } catch (err) {
      console.error("[CRON] onboarding reminder error for", aff?.refId, err);
    }
  }
}

let started = false;

/**
 * Starts a daily cron at 09:05 in the given timezone (default America/New_York).
 * Set CRON_TZ env to override, or pass tz param here.
 */
export function startOnboardingReminderCron(tz?: string) {
  if (started) return;
  started = true;

  const timezone = tz || process.env.CRON_TZ || "America/New_York";

  // Every day at 09:05
  cron.schedule(
    "5 9 * * *",
    () => {
      runLoopOnce().catch((e) => console.error("[CRON] runLoopOnce failed", e));
    },
    { timezone }
  );

  // Optional immediate one-shot for testing if env flag set
  if (String(process.env.RUN_ONBOARDING_REMINDERS_NOW) === "true") {
    runLoopOnce().catch((e) => console.error("[CRON] immediate run failed", e));
  }

  console.log(`[CRON] Onboarding reminders scheduled 09:05 ${timezone}`);
}

// Exported only for tests/manual runs
export const runOnboardingReminderOnce = runLoopOnce;
