import { schedule } from "node-cron";
import { syncAllUsers } from "@/lib/sync";

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

// Registers the recurring GitHub sync. Safe to call more than once.
export function startSyncSchedule(): void {
  if (started) return;
  started = true;

  schedule("0 */3 * * *", runSync);
  console.log("[sync] schedule registered (every 3h)");

  // Initial run so data is fresh after a (re)start.
  void runSync();
}
