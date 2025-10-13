export type OnboardingState = "not_started" | "in_progress" | "complete";
export type OnboardingEvent = "disconnected";

export const TITLES: Record<OnboardingState | OnboardingEvent, string> = {
  not_started: "Stripe account not connected",
  in_progress: "Finish your Stripe onboarding",
  complete: "Success, Stripe onboarding complete",
  disconnected: "Your Stripe connection was disconnected",
};

export const REMINDER_PREFIX = "Reminder — ";

export const BODIES: Record<OnboardingState | OnboardingEvent, string> = {
  not_started: "You need a Stripe account to get paid. Connect now to start onboarding.",
  in_progress: "Almost there—complete your Stripe details to start receiving payouts.",
  complete: "Your Stripe account is ready. You can manage payouts and settings in your dashboard.",
  disconnected: "Your account is no longer connected to Stripe. Reconnect to continue receiving payouts.",
};

export const CTAS = {
  connect: { label: "Connect Stripe", target: "start_onboarding" },
  resume:  { label: "Resume onboarding", target: "resume_onboarding" },
  dashboard: { label: "Open Stripe dashboard", target: "open_dashboard" },
  reconnect: { label: "Reconnect Stripe", target: "start_onboarding" },
} as const;

// Reminder cadence: day offsets; then weekly (handled by your scheduler)
export const REMINDER_DAY_OFFSETS = [7, 14, 21]; // then every 7 days
