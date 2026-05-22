import { schedule } from "node-cron";
import { syncAllUsers } from "@/lib/sync";
import { snapshotCompletedWeek } from "@/lib/winner";

let started = false;

async function runSync(): Promise<void> {
  try {
    const result = await syncAllUsers();
    console.log(
      `[sync] run complete — ok=${result.ok} failed=${result.failed}`,
    );
  } catch (err) {
    console.error("[sync] run failed:", err);
  }
}

async function runWinnerSnapshot(): Promise<void> {
  try {
    const { snapshots } = await snapshotCompletedWeek();
    console.log(`[winner] snapshot complete — ${snapshots} group(s)`);
  } catch (err) {
    console.error("[winner] snapshot failed:", err);
  }
}

// Registers the recurring background jobs. Safe to call more than once.
export function startSchedules(): void {
  if (started) return;
  started = true;

  schedule("0 */3 * * *", runSync); // every 3 hours
  schedule("5 0 * * 1", runWinnerSnapshot); // Mondays 00:05 UTC
  console.log("[schedules] registered: sync (3h), winner snapshot (weekly)");

  // Initial sync so data is fresh after a (re)start.
  void runSync();
}
