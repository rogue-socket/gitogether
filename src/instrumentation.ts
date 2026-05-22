export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSyncSchedule } = await import("@/lib/sync-schedule");
    startSyncSchedule();
  }
}
