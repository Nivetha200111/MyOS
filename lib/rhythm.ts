import type { RecordItem } from "./model";
import { indiaDate, sleepHours, type WhoopSnapshot } from "./whoop-data";
export type Pace = "gentle" | "steady" | "deep";
const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const valid = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const priorDay = (date: string, offset: number) =>
  new Date(Date.parse(date + "T12:00:00Z") + offset * 86400000)
    .toISOString()
    .slice(0, 10);
export function rhythmInsights(
  snapshot: WhoopSnapshot | null,
  records: RecordItem[],
  date: string,
) {
  const cycles = (snapshot?.cycles || [])
    .filter(
      (c) =>
        c.id != null &&
        c.start &&
        Number.isFinite(Date.parse(c.start)) &&
        indiaDate(c.start) <= date &&
        indiaDate(c.start) >= priorDay(date, -29),
    )
    .slice()
    .sort((a, b) => b.start!.localeCompare(a.start!));
  const seen = new Set<string | number>();
  const observations = cycles.flatMap((c) => {
    if (seen.has(c.id!)) return [];
    seen.add(c.id!);
    const recovery = snapshot?.recoveries.find((r) => r.cycle_id === c.id);
    const sleep =
      snapshot?.sleeps.find((s) => s.id === recovery?.sleep_id && !s.nap) ||
      snapshot?.sleeps.find((s) => s.cycle_id === c.id && !s.nap);
    const hours = sleepHours(sleep);
    const score =
      recovery?.score_state === "SCORED" &&
      valid(recovery.score?.recovery_score)
        ? recovery.score.recovery_score
        : null;
    return [{ id: c.id!, date: indiaDate(c.start!), hours, recovery: score }];
  });
  const latest = observations[0] || null;
  const previous = observations
    .slice(1)
    .filter((o) => o.hours !== null)
    .slice(0, 7);
  const baseline =
    previous.length >= 3 ? mean(previous.map((o) => o.hours!)) : null;
  const pairs = observations.filter(
    (o) => o.hours !== null && o.recovery !== null,
  );
  const sorted = pairs.map((o) => o.hours!).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length
    ? sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
    : null;
  const longer = pairs.filter((o) => o.hours! >= median!);
  const shorter = pairs.filter((o) => o.hours! < median!);
  const pattern =
    median !== null && longer.length >= 3 && shorter.length >= 3
      ? {
          threshold: median,
          longer: mean(longer.map((o) => o.recovery!))!,
          shorter: mean(shorter.map((o) => o.recovery!))!,
          longerN: longer.length,
          shorterN: shorter.length,
        }
      : null;
  const week = Array.from({ length: 7 }, (_, i) => {
    const day = priorDay(date, i - 6);
    const reading = observations.find((o) => o.date === day);
    const focus = records.filter(
      (r) =>
        r.kind === "focus" &&
        r.data.status === "Complete" &&
        valid(r.data.started) &&
        indiaDate(new Date(r.data.started).toISOString()) === day,
    );
    const tasks = records.filter(
      (r) => r.kind === "task" && r.data.date === day,
    );
    return {
      date: day,
      sleep: reading?.hours ?? null,
      recovery: reading?.recovery ?? null,
      focus: focus.reduce(
        (n, r) => n + (valid(r.data.minutes) ? r.data.minutes : 0),
        0,
      ),
      sessions: focus.length,
      done: tasks.filter((r) => r.data.done).length,
      tasks: tasks.length,
    };
  });
  const todayTasks = records.filter(
    (r) => r.kind === "task" && r.data.date === date && r.data.priority,
  );
  const pending = todayTasks.filter((r) => !r.data.done);
  const checkIn = records
    .filter((r) => r.kind === "health" && r.data.date === date)
    .sort((a, b) => b.updated - a.updated)[0];
  const revisions = records.filter(
    (r) => r.kind === "problem" && r.data.revision <= date && r.data.stage < 4,
  );
  const weekSleep = week.filter((d) => d.sleep !== null).map((d) => d.sleep!);
  return {
    latest,
    baseline,
    baselineN: previous.length,
    pattern,
    observations,
    week,
    pending,
    todayTasks,
    checkIn,
    revisions,
    plannedMinutes: pending.reduce((n, r) => n + r.data.minutes, 0),
    weekFocus: week.reduce((n, d) => n + d.focus, 0),
    weekSleep: mean(weekSleep),
    weekSleepN: weekSleep.length,
  };
}
export function nextForPace(tasks: RecordItem[], pace: Pace) {
  return tasks
    .slice()
    .sort((a, b) =>
      pace === "gentle"
        ? a.data.minutes - b.data.minutes
        : pace === "deep"
          ? b.data.minutes - a.data.minutes
          : 0,
    )[0];
}
export function sessionMinutes(pace: Pace, task?: RecordItem) {
  return Math.max(
    5,
    Math.min(
      { gentle: 15, steady: 25, deep: 45 }[pace],
      task?.data.minutes || 480,
    ),
  );
}
