"use client";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Sparkles,
  Heart,
  Timer,
  Moon,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import type { WhoopController } from "./use-whoop";
import type { RecordItem } from "@/lib/model";
import {
  rhythmInsights,
  nextForPace,
  sessionMinutes,
  type Pace,
} from "@/lib/rhythm";
const paces = [
  { id: "gentle", label: "Keep it light", note: "A small start" },
  { id: "steady", label: "Find my flow", note: "One clear block" },
  { id: "deep", label: "Go a little deeper", note: "Space to concentrate" },
] as const;
export function DailyCompanion({
  whoop,
  records,
  date,
  onFocus,
  onCheckIn,
  onPlan,
  onReview,
  onReflect,
  onDetails,
}: {
  whoop: WhoopController;
  records: RecordItem[];
  date: string;
  onFocus: (title: string, minutes: number) => void;
  onCheckIn: () => void;
  onPlan: () => void;
  onReview: () => void;
  onReflect: (work: string, health: string) => void;
  onDetails: () => void;
}) {
  const insights = useMemo(
    () => rhythmInsights(whoop.data?.snapshot || null, records, date),
    [whoop.data?.snapshot, records, date],
  );
  const [choice, setChoice] = useState<Pace | null>(null);
  const pace =
    choice || (insights.checkIn?.data.energy === "Low" ? "gentle" : "steady");
  const next = nextForPace(insights.pending, pace);
  const minutes = sessionMinutes(pace, next);
  const [selected, setSelected] = useState(date);
  const selectedDay =
    insights.week.find((d) => d.date === selected) || insights.week[6];
  const fresh =
    !!whoop.data?.updated && Date.now() - whoop.data.updated < 30 * 60000;
  const todayReading = insights.latest?.date === date ? insights.latest : null;
  const sleep = todayReading?.hours ?? null;
  const delta =
    sleep !== null && insights.baseline !== null
      ? sleep - insights.baseline
      : null;
  const sleepNote =
    delta === null
      ? sleep === null
        ? "Your next sleep reading will appear here after WHOOP syncs."
        : "A few more sleep records will give us a useful personal comparison."
      : Math.abs(delta) < 0.2
        ? `Close to your recent average of ${insights.baseline!.toFixed(1)}h across ${insights.baselineN} previous sleeps.`
        : `${Math.abs(delta).toFixed(1)}h ${delta > 0 ? "longer" : "shorter"} than your average across ${insights.baselineN} previous sleeps.`;
  const pattern = insights.pattern;
  const split = pattern ? pattern.longer - pattern.shorter : 0;
  const allDone =
    insights.todayTasks.length > 0 && insights.pending.length === 0;
  const completedFocus = insights.week[6].focus;
  const reflectionHealth =
    insights.weekSleep === null
      ? "No synced sleep readings this week."
      : `${insights.weekSleep.toFixed(1)}h average sleep across ${insights.weekSleepN} recorded days. What helped me feel rested?`;
  return (
    <section className="daily-companion" aria-label="ORBIT daily companion">
      <div className="companion-hero">
        <div className="companion-intro">
          <p className="eyebrow">
            <Sparkles size={14} /> ORBIT / YOUR DAILY COMPANION
          </p>
          <h2>
            {allDone ? (
              <>
                You made room.
                <br />
                <em>Now enjoy the rest.</em>
              </>
            ) : (
              <>
                A day that fits
                <br />
                <em>the whole of you.</em>
              </>
            )}
          </h2>
          <p>
            {insights.checkIn
              ? `You checked in feeling ${insights.checkIn.data.energy.toLowerCase()}. ${pace === "gentle" ? "A small, intentional start is enough." : "Let’s make room for one thing that matters."}`
              : "Before the tasks and the numbers: how do you want today to feel?"}
          </p>
          <button className="button secondary" onClick={onCheckIn}>
            <Heart size={16} />{" "}
            {insights.checkIn ? "Update how I feel" : "Check in with myself"}
          </button>
          <div className="companion-context">
            <span>
              {whoop.data?.connected ? "WHOOP connected" : "WHOOP optional"}
            </span>
            <span>
              {completedFocus
                ? `${completedFocus} focused minutes today`
                : "A fresh page for today"}
            </span>
          </div>
        </div>
        <div className="companion-next">
          <p className="eyebrow">YOU SET THE PACE</p>
          <div
            className="pace-options"
            role="group"
            aria-label="Pace for my next session"
          >
            {paces.map((p) => (
              <button
                key={p.id}
                aria-pressed={pace === p.id}
                onClick={() => setChoice(p.id)}
              >
                <strong>{p.label}</strong>
                <small>{p.note}</small>
              </button>
            ))}
          </div>
          <p className="pace-explanation">
            {!choice && insights.checkIn?.data.energy === "Low"
              ? "A lighter start, based on your own check-in. Change it whenever you like."
              : "Try a pace for your next session. Your choice shapes the suggestion below."}
          </p>
          <div className="next-move">
            <span>
              {next
                ? `${next.data.lane.toUpperCase()} / ONE NEXT MOVE`
                : allDone
                  ? "NOTHING LEFT TO PROVE TODAY"
                  : "ONE NEXT MOVE"}
            </span>
            <h3>
              {next?.data.title ||
                (allDone
                  ? "Your priorities are done."
                  : "Choose something worth a little of your day.")}
            </h3>
            <p>
              {next
                ? `${insights.pending.length} ${insights.pending.length === 1 ? "priority" : "priorities"} left · ${insights.plannedMinutes} planned minutes. ${pace === "gentle" ? "The shortest task is up first." : pace === "deep" ? "Start a block on your longest task." : "Start with the first priority on your list."}`
                : allDone
                  ? "You can leave the list here. Make space for the rest of your life."
                  : "A work outcome, a problem to understand, or something just for you."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() =>
              next
                ? onFocus(next.data.title, minutes)
                : allDone
                  ? onCheckIn()
                  : onPlan()
            }
          >
            {next ? <Timer size={16} /> : <ArrowUpRight size={16} />}{" "}
            {next
              ? `Start a ${minutes}-minute session`
              : allDone
                ? "How did today feel?"
                : "Choose my next thing"}
          </button>
        </div>
      </div>
      <div className="companion-insights">
        <article className="orbit-observation">
          <p className="eyebrow">
            <Moon size={14} /> SLEEP, IN YOUR CONTEXT
          </p>
          <h3>
            {sleep === null
              ? "Getting to know your rhythm."
              : `${sleep.toFixed(1)} hours, with a little context.`}
          </h3>
          <p>{sleepNote}</p>
          <small>
            {whoop.data?.connected
              ? `${fresh ? "Latest sync" : "Saved readings; refresh for an update"}${todayReading?.recovery != null ? ` · ${todayReading.recovery}% recovery` : ""}. Your check-in adds the part your wearable can’t.`
              : "Connect WHOOP from the details below whenever you’re ready."}
          </small>
        </article>
        <article className="orbit-observation">
          <p className="eyebrow">
            <BookOpen size={14} /> KEEP A LITTLE MOMENTUM
          </p>
          <h3>
            {insights.revisions.length
              ? `${insights.revisions.length} ${insights.revisions.length === 1 ? "idea is" : "ideas are"} ready to revisit.`
              : completedFocus
                ? "You’ve already shown up."
                : "Progress can be small."}
          </h3>
          <p>
            {insights.revisions.length
              ? `“${insights.revisions[0].data.title}” is due for revision. A familiar problem can be a place to start.`
              : completedFocus
                ? `${completedFocus} minutes of completed focus are recorded today. Take a moment to notice what moved forward.`
                : "Record one thing you want to move forward. ORBIT will connect your daily plans with the progress you actually log."}
          </p>
          {insights.revisions.length ? (
            <button className="text-button" onClick={onReview}>
              Open my revisions <ArrowUpRight size={14} />
            </button>
          ) : (
            <button className="text-button" onClick={onPlan}>
              Make a little room <ArrowUpRight size={14} />
            </button>
          )}
        </article>
      </div>
      <div className="companion-week">
        <div className="companion-section-heading">
          <div>
            <p className="eyebrow">A WEEK IN YOUR LIFE</p>
            <h3>Rest. Focus. Repeat, imperfectly.</h3>
          </div>
          <span className="week-legend">
            <i /> Sleep <i /> Focus
          </span>
        </div>
        <div
          className="week-days"
          role="group"
          aria-label="Explore your last seven days"
        >
          {insights.week.map((d) => (
            <button
              className={selectedDay.date === d.date ? "selected" : ""}
              aria-pressed={selectedDay.date === d.date}
              aria-label={`${d.date}: ${d.sleep == null ? "sleep unavailable" : d.sleep.toFixed(1) + " hours sleep"}, ${d.focus} minutes recorded focus`}
              key={d.date}
              onClick={() => setSelected(d.date)}
            >
              <span>
                {new Date(d.date + "T12:00:00Z").toLocaleDateString("en-IN", {
                  weekday: "short",
                  timeZone: "Asia/Kolkata",
                })}
              </span>
              <div className="day-bars" aria-hidden="true">
                <i
                  style={{
                    height:
                      d.sleep === null
                        ? "3px"
                        : `${Math.min(100, (d.sleep / 10) * 100)}%`,
                  }}
                />
                <i
                  style={{
                    height:
                      d.focus === 0
                        ? "3px"
                        : `${Math.min(100, (d.focus / 180) * 100)}%`,
                  }}
                />
              </div>
              <strong>{Number(d.date.slice(-2))}</strong>
            </button>
          ))}
        </div>
        <div className="day-caption" aria-live="polite">
          <strong>
            {selectedDay.date === date
              ? "Today"
              : new Date(selectedDay.date + "T12:00:00Z").toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", timeZone: "Asia/Kolkata" },
                )}
          </strong>
          <span>
            {selectedDay.sleep === null
              ? "Sleep not available"
              : `${selectedDay.sleep.toFixed(1)}h asleep`}
          </span>
          <span>
            {selectedDay.sessions
              ? `${selectedDay.focus}m focus · ${selectedDay.sessions} sessions`
              : "No focus sessions recorded"}
          </span>
          <span>
            {selectedDay.tasks
              ? `${selectedDay.done}/${selectedDay.tasks} tasks complete`
              : "No tasks recorded"}
          </span>
        </div>
        <small>
          Bars use separate scales: sleep up to 10h; recorded focus up to 180m.
          Missing entries don’t mean you did nothing. Dates in IST; latest cycle
          per day.
        </small>
      </div>
      <div className="companion-pattern">
        <div>
          <p className="eyebrow">A PATTERN TO GET CURIOUS ABOUT</p>
          <h3>
            {!pattern
              ? "We’ll let your history do the talking."
              : Math.abs(split) < 5
                ? "Sleep and recovery aren’t a simple equation."
                : `Your longer sleeps came with ${Math.abs(split).toFixed(0)} points ${split > 0 ? "higher" : "lower"} recovery, on average.`}
          </h3>
          <p>
            {pattern
              ? `In your last 30 days, ${pattern.longerN} sleeps at or above ${pattern.threshold.toFixed(1)}h averaged ${pattern.longer.toFixed(0)}% recovery; ${pattern.shorterN} shorter sleeps averaged ${pattern.shorter.toFixed(0)}%. This is an association in a small personal sample, not proof that sleep caused the difference.`
              : "After at least three longer and three shorter scored sleeps, ORBIT can compare recovery across your own history. No generic score to chase."}
          </p>
          {pattern && (
            <div className="pattern-comparison">
              <div>
                <span>Longer sleeps · {pattern.longerN}</span>
                <i style={{ width: `${Math.max(1, pattern.longer)}%` }} />
                <strong>{pattern.longer.toFixed(0)}%</strong>
              </div>
              <div>
                <span>Shorter sleeps · {pattern.shorterN}</span>
                <i style={{ width: `${Math.max(1, pattern.shorter)}%` }} />
                <strong>{pattern.shorter.toFixed(0)}%</strong>
              </div>
            </div>
          )}
        </div>
        <aside>
          <p className="eyebrow">SAVE THE THOUGHT</p>
          <h4>What’s working for you?</h4>
          <p>
            Start a weekly reflection with your logged focus and sleep summary
            already filled in.
          </p>
          <button
            className="button secondary"
            onClick={() =>
              onReflect(
                `${insights.weekFocus} minutes of completed focus recorded in the last seven days. What moved forward?`,
                reflectionHealth,
              )
            }
          >
            Reflect on my week <ArrowUpRight size={15} />
          </button>
        </aside>
      </div>
      <div className="companion-footer">
        <span>
          ORBIT uses your records and transparent rules. You make the decisions.
        </span>
        <div>
          {whoop.data?.connected && (
            <button
              className="text-button"
              disabled={whoop.busy}
              onClick={() => whoop.refresh(true)}
            >
              <RefreshCw size={14} />
              {whoop.busy ? "Refreshing…" : "Refresh signals"}
            </button>
          )}
          <button className="text-button" onClick={onDetails}>
            Connection & readings <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      {whoop.error && (
        <p className="companion-error" role="status">
          {whoop.error}
        </p>
      )}
    </section>
  );
}
