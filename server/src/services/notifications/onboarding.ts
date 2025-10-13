import { Types } from "mongoose";
import Affiliate from "../../models/Affiliate";
import {
  TITLES,
  BODIES,
  REMINDER_PREFIX,
  type OnboardingState,
} from "../../constants/onboarding";

const STATE_TITLES = new Set([
  TITLES.not_started,
  TITLES.in_progress,
  TITLES.complete,
]);

/**
 * Create a notification (schema-compatible: title, text, read, date).
 */
async function createNotice(refId: string, title: string, text: string) {
  const oid = new Types.ObjectId();
  await Affiliate.updateOne(
    { refId },
    {
      $push: {
        notifications: {
          _id: oid,
          id: oid.toString(),
          title,
          text,
          read: false,
          date: new Date(),
        },
      },
    }
  );
}

/**
 * Create initial per-state notice — idempotent by exact title.
 * - not_started / in_progress: at most one "initial" each per cycle
 * - complete: one per cycle
 */
export async function createInitialForState(
  refId: string,
  state: OnboardingState
) {
  const title = TITLES[state];
  const exists = await Affiliate.exists({
    refId,
    notifications: { $elemMatch: { title } },
  });
  if (exists) return;
  await createNotice(refId, title, BODIES[state]);
}

/**
 * Create a reminder for stalled not_started/in_progress (duplicates allowed).
 */
export async function createReminder(
  refId: string,
  state: Exclude<OnboardingState, "complete">
) {
  const title = `${REMINDER_PREFIX}${TITLES[state]}`;
  await createNotice(
    refId,
    title,
    "Still pending. Complete this step so you can receive payouts."
  );
}

/**
 * Complete (one-time per cycle).
 */
export async function createCompleteOnce(refId: string) {
  await createInitialForState(refId, "complete");
}

/**
 * Disconnect flow:
 * 1) Create 'disconnected'
 * 2) Purge all onboarding notices from prior cycle
 * 3) Create fresh 'not_started'
 */
export async function handleDisconnect(refId: string) {
  // 1) Event
  await purgeOnboardingNotices(refId);

  // 2) Purge all onboarding notices (canonical + reminder variants)
  await createNotice(refId, TITLES.disconnected, BODIES.disconnected);

  // 3) Fresh cycle start
  await createInitialForState(refId, "not_started");
}

/**
 * Record state transition from your status oracle.
 * - If user completes in one session, call createCompleteOnce() directly.
 * - If user pauses, call with 'in_progress'.
 */
// ...imports...

export async function recordState(refId: string, state: OnboardingState) {
  if (state === "complete") {
    // Already have a 'complete' notice? No-op (prevents new id each refresh)
    const hasComplete = await Affiliate.exists({
      refId,
      "notifications.title": TITLES.complete,
    });
    if (hasComplete) return;

    // First time we hit complete in this cycle → normalize once
    await purgeOnboardingNotices(refId); // removes prior not_started/in_progress/reminders
    await createCompleteOnce(refId); // creates the single complete notice
    return;
  }

  // not_started / in_progress → seed once (your createInitialForState is already idempotent)
  await createInitialForState(refId, state);
}

/**
 * Purge all onboarding notifications by title matching.
 * Leaves other non-onboarding notifications untouched.
 */
export async function purgeOnboardingNotices(refId: string) {
  // Build $or selector: canonical titles + reminder-prefixed titles
  const or = [
    { "notifications.title": { $in: Array.from(STATE_TITLES) } },
    { "notifications.title": { $regex: `^${escapeRegex(REMINDER_PREFIX)}` } },
  ];

  // Pull any notification whose title matches either condition
  await Affiliate.updateOne(
    { refId, $or: or },
    {
      $pull: {
        notifications: {
          $or: [
            { title: { $in: Array.from(STATE_TITLES) } },
            { title: { $regex: `^${escapeRegex(REMINDER_PREFIX)}` } },
          ],
        },
      },
    }
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
