export type WhoopRecord = {
  id?: string | number;
  cycle_id?: number;
  sleep_id?: string;
  start?: string;
  end?: string;
  created_at?: string;
  updated_at?: string;
  nap?: boolean;
  score_state?: string;
  score?: Record<string, any>;
  sport_name?: string;
  sport_id?: number;
};
export type WhoopSnapshot = {
  cycles: WhoopRecord[];
  recoveries: WhoopRecord[];
  sleeps: WhoopRecord[];
  workouts: WhoopRecord[];
};
export type WhoopStatus = {
  configured: boolean;
  connected: boolean;
  updated: number | null;
  snapshot: WhoopSnapshot | null;
  redirectUri: string | null;
  error?: string;
};
export const emptySnapshot = (): WhoopSnapshot => ({
  cycles: [],
  recoveries: [],
  sleeps: [],
  workouts: [],
});
export function sleepHours(sleep?: WhoopRecord) {
  if (sleep?.score_state !== "SCORED") return null;
  const stages = sleep.score?.stage_summary;
  if (!stages) return null;
  const values = [
    stages.total_light_sleep_time_milli,
    stages.total_slow_wave_sleep_time_milli,
    stages.total_rem_sleep_time_milli,
  ];
  return values.every((v) => typeof v === "number" && Number.isFinite(v))
    ? values.reduce((a, b) => a + b, 0) / 3600000
    : null;
}
export function cycleSignals(snapshot: WhoopSnapshot | null) {
  const cycle = snapshot?.cycles
    .slice()
    .sort((a, b) => (b.start || "").localeCompare(a.start || ""))[0];
  const recovery = snapshot?.recoveries.find((r) => r.cycle_id === cycle?.id);
  const sleep =
    snapshot?.sleeps.find((s) => s.id === recovery?.sleep_id) ||
    snapshot?.sleeps.find((s) => !s.nap && s.cycle_id === cycle?.id);
  return {
    cycle,
    recovery,
    sleep,
    recoveryScore:
      recovery?.score_state === "SCORED"
        ? (recovery.score?.recovery_score ?? null)
        : null,
    strain:
      cycle?.score_state === "SCORED" ? (cycle.score?.strain ?? null) : null,
    hours: sleepHours(sleep),
  };
}
export function indiaDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
