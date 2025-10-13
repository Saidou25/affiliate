// utils/sortNotifications.ts
export type NotifWithDateAndId = {
  _id?: string | { toString(): string };
  id?: string;                // some code uses id; we’ll fall back to it
  date?: string | Date;
  createdAt?: string | Date;
};

export function sortNotifications<T extends NotifWithDateAndId>(
  notifications: T[] | undefined | null
): T[] {
  const list = notifications ?? [];
  return [...list].sort((a, b) => {
    const ad = new Date(a?.date ?? a?.createdAt ?? 0).getTime();
    const bd = new Date(b?.date ?? b?.createdAt ?? 0).getTime();
    if (bd !== ad) return bd - ad; // newest first

    // Tie-breaker: ObjectId string DESC (later-created first)
    const aId =
      (typeof a?._id === "string" ? a._id : a?._id?.toString?.()) ??
      (typeof a?.id === "string" ? a.id : "") ??
      "";
    const bId =
      (typeof b?._id === "string" ? b._id : b?._id?.toString?.()) ??
      (typeof b?.id === "string" ? b.id : "") ??
      "";
    return bId.localeCompare(aId);
  });
}


// export type NotifWithDate = { date?: string; createdAt?: string };

// export function sortNotifications<T extends NotifWithDate>(
//   notifications: T[] | undefined | null
// ): T[] {
//   const list = notifications ?? [];
//   return [...list].sort((a, b) => {
//     const at = new Date(a?.date ?? a?.createdAt ?? 0).getTime();
//     const bt = new Date(b?.date ?? b?.createdAt ?? 0).getTime();
//     return bt - at; // newest first
//   });
// }
