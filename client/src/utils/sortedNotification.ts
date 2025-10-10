
export type NotifWithDate = { date?: string; createdAt?: string };

export function sortNotifications<T extends NotifWithDate>(
  notifications: T[] | undefined | null
): T[] {
  const list = notifications ?? [];
  return [...list].sort((a, b) => {
    const at = new Date(a?.date ?? a?.createdAt ?? 0).getTime();
    const bt = new Date(b?.date ?? b?.createdAt ?? 0).getTime();
    return bt - at; // newest first
  });
}
