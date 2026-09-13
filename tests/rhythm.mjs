import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const temp = await mkdtemp(join(tmpdir(), "nivetha-rhythm-"));
try {
  await build({
    entryPoints: ["lib/rhythm.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: join(temp, "rhythm.mjs"),
  });
  const { rhythmInsights, nextForPace, sessionMinutes } = await import(
    pathToFileURL(join(temp, "rhythm.mjs"))
  );
  const blank = rhythmInsights(null, [], "2026-09-13");
  assert.equal(blank.baseline, null);
  assert.equal(blank.pattern, null);
  assert.equal(blank.week.length, 7);
  assert.ok(blank.week.every((d) => d.sleep === null));
  const snapshot = { cycles: [], recoveries: [], sleeps: [], workouts: [] };
  for (let i = 0; i < 8; i++) {
    const date = `2026-09-${String(13 - i).padStart(2, "0")}`;
    const hours = i % 2 ? 5 : 8;
    snapshot.cycles.push({ id: i, start: date + "T00:00:00Z" });
    snapshot.recoveries.push({
      cycle_id: i,
      sleep_id: "s" + i,
      score_state: "SCORED",
      score: { recovery_score: i % 2 ? 30 : 70 },
    });
    snapshot.sleeps.push({
      id: "s" + i,
      cycle_id: i,
      nap: false,
      score_state: "SCORED",
      score: {
        stage_summary: {
          total_light_sleep_time_milli: hours * 3600000,
          total_slow_wave_sleep_time_milli: 0,
          total_rem_sleep_time_milli: 0,
        },
      },
    });
  }
  const insight = rhythmInsights(snapshot, [], "2026-09-13");
  assert.equal(insight.latest.hours, 8);
  assert.equal(insight.baselineN, 7);
  assert.equal(insight.pattern.longer, 70);
  assert.equal(insight.pattern.shorter, 30);
  assert.equal(insight.pattern.longerN, 4);
  assert.equal(insight.pattern.shorterN, 4);
  snapshot.cycles.push(snapshot.cycles[0]);
  assert.equal(
    rhythmInsights(snapshot, [], "2026-09-13").observations.length,
    8,
    "duplicate cycle must not double count",
  );
  snapshot.cycles.push({ id: 50, start: "2026-09-14T00:00:00Z" });
  assert.equal(
    rhythmInsights(snapshot, [], "2026-09-13").observations.length,
    8,
    "exclude future cycles",
  );
  snapshot.sleeps[0].score_state = "PENDING_SCORE";
  assert.equal(
    rhythmInsights(snapshot, [], "2026-09-13").latest.hours,
    null,
    "do not backfill today from older sleep",
  );
  const tasks = [10, 45, 25].map((minutes, i) => ({
    id: "t" + i,
    kind: "task",
    updated: 0,
    version: 1,
    data: {
      minutes,
      title: "Test task " + i,
      date: "2026-09-13",
      priority: true,
      done: false,
    },
  }));
  assert.equal(nextForPace(tasks, "gentle").data.minutes, 10);
  assert.equal(nextForPace(tasks, "deep").data.minutes, 45);
  assert.equal(nextForPace(tasks, "steady").id, "t0");
  assert.equal(sessionMinutes("gentle", tasks[0]), 10);
  assert.equal(sessionMinutes("deep", tasks[2]), 25);
  assert.equal(sessionMinutes("steady"), 25);
  const records = [
    ...tasks,
    {
      id: "f",
      kind: "focus",
      updated: 0,
      version: 1,
      data: {
        started: Date.parse("2026-09-12T20:00:00Z"),
        minutes: 25,
        status: "Complete",
      },
    },
    {
      id: "cancel",
      kind: "focus",
      updated: 0,
      version: 1,
      data: {
        started: Date.parse("2026-09-13T10:00:00Z"),
        minutes: 45,
        status: "Cancelled",
      },
    },
  ];
  const daily = rhythmInsights(snapshot, records, "2026-09-13");
  assert.equal(
    daily.week[6].focus,
    25,
    "focus uses IST and only completed sessions",
  );
  assert.equal(daily.plannedMinutes, 80);
  assert.equal(daily.pending.length, 3);
  console.log(
    "PASS: personal baselines, minimum samples, missing scores, deduplication, future filtering, IST focus joins, explicit pace and session sizing.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
