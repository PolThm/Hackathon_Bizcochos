/**
 * Returns the storage key for the daily routine.
 * The "day" changes at 6am: before 6am we're still in the previous calendar day.
 * Uses localStorage so the routine persists when the browser is closed.
 */
export function getDailyRoutineStorageKey(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return `dailyRoutine_${yesterday.toISOString().split('T')[0]}`;
  }
  return `dailyRoutine_${now.toISOString().split('T')[0]}`;
}
