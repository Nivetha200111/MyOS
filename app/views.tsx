"use client";
import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  Activity,
  Check,
  ChevronRight,
  Code2,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Edit3,
  ShieldCheck,
  Target,
  Volume2,
  Mountain,
  Clock,
  Download,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  type RecordItem,
  type Kind,
  patterns,
  day,
  afterDay,
  roadmap,
  buildMilestones,
} from "@/lib/model";
import { type EditTarget, kindLabels } from "./editor";
type Props = {
  page: string;
  records: RecordItem[];
  edit: (t: EditTarget) => void;
  save: (kind: Kind, data: any, record?: RecordItem) => Promise<boolean>;
  remove: (r: RecordItem) => void;
};
const titles: Record<string, [string, string]> = {
  Today: [
    "Make today count.",
    "Three priorities. Enough space to do them well.",
  ],
  "Active goals": [
    "Four lanes. One direction.",
    "The plan can evolve. Your capacity has a limit.",
  ],
  Work: [
    "Turn ownership into evidence.",
    "Client delivery and internal leadership have separate queues.",
  ],
  LeetCode: [
    "Understand the pattern.",
    "Python for problem solving. Explanation before mastery.",
  ],
  Build: [
    "Build something of your own.",
    "One Ruby / Rails project. Small releases, real engineering.",
  ],
  "Body + life": [
    "Strong. Athletic. Well.",
    "Recovery and a life outside work belong in the plan.",
  ],
  Knowledge: [
    "Keep what you understand.",
    "Durable notes, connected to the work that taught you.",
  ],
  Reviews: [
    "Reflect. Adjust. Remove.",
    "Progress is evidence of change, not a record of exhaustion.",
  ],
  "Not now": [
    "An idea is not an obligation.",
    "Capture it. Reconsider deliberately. Protect your current focus.",
  ],
  "Career + money": [
    "Make your value visible.",
    "Career evidence, clear decisions, and financial checkpoints.",
  ],
};
export function View({ page, records, edit, save, remove }: Props) {
  const [query, setQuery] = useState("");
  const list = (k: Kind) => records.filter((r) => r.kind === k);
  const add = (kind: Kind, initial?: any) => edit({ kind, initial });
  const cards = (kind: Kind, filter?: (r: RecordItem) => boolean) => {
    const entries = list(kind).filter(filter ?? (() => true));
    return (
      <div className="record-grid">
        {!entries.length ? (
          <div className="empty-state">
            <Target size={25} />
            <h3>No {kindLabels[kind].toLowerCase()} entries yet.</h3>
            <p>Your history starts with your first real entry.</p>
            <button className="button secondary" onClick={() => add(kind)}>
              Add {kindLabels[kind].toLowerCase()}
            </button>
          </div>
        ) : (
          entries.map((r) => (
            <article className="record-card" key={r.id}>
              <div className="record-top">
                <span className="eyebrow">
                  {r.data.lane ||
                    r.data.category ||
                    r.data.project ||
                    r.data.period ||
                    r.data.activity ||
                    r.data.difficulty ||
                    kindLabels[kind]}
                </span>
                <div>
                  <button
                    aria-label={"Edit " + (r.data.title || r.data.date)}
                    onClick={() => edit({ kind, record: r })}
                  >
                    <Edit3 size={14} />
                  </button>
                  {!r.id.startsWith("goal-") && (
                    <button
                      aria-label={"Delete " + (r.data.title || r.data.date)}
                      onClick={() => remove(r)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3>{r.data.title || r.data.date}</h3>
              {r.data.date && <small>{r.data.date}</small>}
              {kind === "task" && (
                <div className="inline-actions">
                  <Checkbox
                    aria-label={"Complete " + r.data.title}
                    checked={r.data.done}
                    onCheckedChange={(v) =>
                      save(kind, { ...r.data, done: v === true }, r)
                    }
                  />
                  <span>
                    {r.data.done
                      ? "Completed"
                      : r.data.priority
                        ? "Daily priority"
                        : "Scheduled"}{" "}
                    · {r.data.minutes} min
                  </span>
                </div>
              )}
              {kind === "goal" && (
                <span className="small-badge">{r.data.status}</span>
              )}
              {kind === "health" && (
                <div className="health-values">
                  <span>
                    {r.data.sleep}h <small>sleep</small>
                  </span>
                  <span>
                    {r.data.minutes}m <small>{r.data.activity}</small>
                  </span>
                  <span>
                    {r.data.energy} <small>energy</small>
                  </span>
                </div>
              )}
              {kind === "problem" && (
                <>
                  <p>
                    {r.data.pattern} ·{" "}
                    {r.data.independent ? "Independent" : "Assisted"}
                    {r.data.hints ? " · Hints used" : ""}
                  </p>
                  <p>
                    <b>Complexity:</b> {r.data.complexity}
                  </p>
                  <p>{r.data.insight}</p>
                  <p className="mint">
                    Revise {r.data.revision}
                    {r.data.stage === 4 ? " · Cycle complete" : ""}
                  </p>
                </>
              )}
              {kind === "cert" && (
                <>
                  <p>
                    {r.data.status} · practice score {r.data.score}%
                  </p>
                  <Progress value={r.data.progress} />
                  <p>
                    {r.data.progress}% complete{" "}
                    {r.data.exam ? "· Exam " + r.data.exam : ""}
                  </p>
                </>
              )}
              {kind === "money" && (
                <div className="money-values">
                  {[
                    ["salary", "Annual compensation"],
                    ["savings", "Savings"],
                    ["expenses", "Monthly expenses"],
                    ["target", "Next compensation target"],
                  ].map(([key, label]) => (
                    <p key={key}>
                      {label}
                      <strong>
                        ₹{Number(r.data[key]).toLocaleString("en-IN")}
                      </strong>
                    </p>
                  ))}
                </div>
              )}
              {[
                "description",
                "metric",
                "content",
                "impact",
                "notes",
                "reason",
                "alternative",
                "note",
                "next",
                "remove",
                "strength",
              ].map((key) =>
                r.data[key] ? (
                  <p key={key} className="record-text">
                    {["metric", "alternative", "remove", "next"].includes(
                      key,
                    ) ? (
                      <b>
                        {
                          (
                            {
                              metric: "Evidence",
                              alternative: "Alternative",
                              remove: "Stop doing",
                              next: "Next focus",
                            } as any
                          )[key]
                        }
                        :{" "}
                      </b>
                    ) : null}
                    {r.data[key]}
                  </p>
                ) : null,
              )}
              {kind === "review" && (
                <details>
                  <summary>Read full reflection</summary>
                  {[
                    "work",
                    "learning",
                    "patterns",
                    "shipped",
                    "health",
                    "life",
                    "money",
                  ].map((k) => (
                    <p key={k}>
                      <b>{k}:</b> {r.data[k] || "—"}
                    </p>
                  ))}
                </details>
              )}
              {r.data.reconsider && (
                <p className="mint">Reconsider {r.data.reconsider}</p>
              )}
              {r.data.review && <p className="mint">Review {r.data.review}</p>}
              {r.data.link && (
                <a
                  className="text-button"
                  href={r.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View evidence <ArrowUpRight size={14} />
                </a>
              )}
              {kind === "life" && (
                <div className="inline-actions">
                  <Checkbox
                    aria-label={"Enjoyed " + r.data.title}
                    checked={r.data.done}
                    onCheckedChange={(v) =>
                      save(kind, { ...r.data, done: v === true }, r)
                    }
                  />
                  Made time for this
                </div>
              )}
            </article>
          ))
        )}
      </div>
    );
  };
  const date = day();
  const today = list("task").filter((r) => r.data.date === date);
  const title = titles[page];
  return (
    <>
      <div className="module-heading">
        <p className="eyebrow">NIVETHA OS / {page.toUpperCase()}</p>
        <h1>{title?.[0]}</h1>
        <p>{title?.[1]}</p>
      </div>
      {page === "Today" && (
        <>
          <div className="notice">
            <ShieldCheck size={19} />
            <p>
              Choose up to three outcomes for {date}. Missed tasks stay in your
              backlog; they do not multiply today’s obligations.
            </p>
            <button
              className="button primary"
              onClick={() => add("task", { priority: true })}
            >
              <Plus size={15} /> Add task
            </button>
          </div>
          <div className="section-heading">
            <h2>Today’s commitments</h2>
            <span className="small-badge">
              {today.filter((r) => r.data.done).length} / {today.length}{" "}
              completed
            </span>
          </div>
          {cards("task", (r) => r.data.date === date)}
          <h2 className="subhead">
            Overdue · reconsider, reschedule, or remove
          </h2>
          {cards("task", (r) => r.data.date < date && !r.data.done)}
          <h2 className="subhead">Coming up</h2>
          {cards("task", (r) => r.data.date > date && !r.data.done)}
        </>
      )}
      {page === "Active goals" && (
        <>
          <div className="notice">
            <ShieldCheck size={20} />
            <p>
              <strong>
                {list("goal").filter((r) => r.data.status === "Active").length}{" "}
                / 4 active.
              </strong>{" "}
              To introduce a goal, pause an existing one first. Your parked
              ideas stay safe in Not now.
            </p>
            <button className="button secondary" onClick={() => add("goal")}>
              Add goal
            </button>
          </div>
          {cards("goal")}
          <h2 className="subhead">Your 24-month direction</h2>
          <p className="muted">
            September 2026 → August 2028 · Proposed milestones. Review quarterly
            and adjust to actual progress.
          </p>
          <div className="roadmap">
            {roadmap.map(([id, date, title, description]) => {
              const r = list("milestone").find((r) =>
                r.data.title.startsWith(id + " ·"),
              );
              return (
                <article
                  key={id}
                  className={
                    r?.data.done ? "roadmap-item reached" : "roadmap-item"
                  }
                >
                  <span className="phase-marker">{id}</span>
                  <div>
                    <p className="eyebrow">{date}</p>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <button
                      className="text-button"
                      onClick={() =>
                        edit({
                          kind: "milestone",
                          record: r,
                          initial: { title: id + " · " + title },
                        })
                      }
                    >
                      {r?.data.done
                        ? "✓ Milestone reached"
                        : r
                          ? "Update checkpoint"
                          : "Record checkpoint"}{" "}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="notice">
            <Target size={18} />
            <p>
              This is a direction, not a guarantee. Judge the plan by better
              problem solving, shipped software, career options, and sustainable
              wellbeing.
            </p>
          </div>
        </>
      )}
      {page === "Work" && (
        <Tabs defaultValue="Client · Sonora">
          <TabsList>
            <TabsTrigger value="Client · Sonora">Client · Sonora</TabsTrigger>
            <TabsTrigger value="Internal · KeenStack">
              Internal · KeenStack
            </TabsTrigger>
            <TabsTrigger value="Evidence">Career evidence</TabsTrigger>
          </TabsList>
          {["Client · Sonora", "Internal · KeenStack"].map((project) => (
            <TabsContent value={project} key={project}>
              <div className="notice">
                <p>
                  {project.startsWith("Client")
                    ? "AI Estimation Agent · resource availability · role and skill logic · demand UI."
                    : "Contract Management · AI demo leadership · integrations · architecture."}
                </p>
                <button
                  className="button primary"
                  onClick={() => add("task", { lane: "Work", project })}
                >
                  <Plus size={15} /> Add deliverable
                </button>
              </div>
              {cards(
                "task",
                (r) => r.data.lane === "Work" && r.data.project === project,
              )}
            </TabsContent>
          ))}
          <TabsContent value="Evidence">
            <div className="notice">
              <p>
                Record the problem, your action, and a verified outcome. Use
                sanitized links and examples.
              </p>
              <button
                className="button primary"
                onClick={() => add("evidence")}
              >
                Capture evidence
              </button>
            </div>
            {cards("evidence")}
          </TabsContent>
        </Tabs>
      )}
      {page === "LeetCode" && (
        <>
          <div className="metric-strip">
            {["Easy", "Medium", "Hard"].map((d) => (
              <div key={d}>
                <strong>
                  {
                    list("problem").filter((r) => r.data.difficulty === d)
                      .length
                  }
                </strong>
                <span>{d}</span>
              </div>
            ))}
            <div>
              <strong>
                {
                  list("problem").filter(
                    (r) => r.data.independent && !r.data.hints,
                  ).length
                }
              </strong>
              <span>Independent, no hints</span>
            </div>
            <button className="button primary" onClick={() => add("problem")}>
              <Plus size={15} /> Log practice
            </button>
          </div>
          <Tabs defaultValue="patterns">
            <TabsList>
              <TabsTrigger value="patterns">Pattern map</TabsTrigger>
              <TabsTrigger value="revision">Revision queue</TabsTrigger>
              <TabsTrigger value="history">Practice log</TabsTrigger>
            </TabsList>
            <TabsContent value="patterns">
              <p className="muted">
                150–200 understood problems by March 2027 is a planning
                milestone, not a score to chase.
              </p>
              <div className="pattern-grid">
                {patterns.map((p, i) => {
                  const r = list("pattern").find((r) => r.data.title === p);
                  return (
                    <button
                      key={p}
                      className="pattern-card"
                      onClick={() =>
                        edit({
                          kind: "pattern",
                          record: r,
                          initial: { title: p },
                        })
                      }
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <h3>{p}</h3>
                      <small
                        className={
                          r?.data.confidence === "Comfortable" ? "mint" : ""
                        }
                      >
                        {r?.data.confidence || "Not started"}
                      </small>
                      <Code2 size={16} />
                    </button>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="revision">
              <div className="notice">
                <RefreshCw size={18} />
                <p>
                  Revisit on days 1, 3, 14, and 30 from the original practice
                  date. Explain it unaided; if you cannot, mark the pattern weak
                  and retry.
                </p>
              </div>
              {list("problem")
                .filter((r) => r.data.revision <= date && r.data.stage < 4)
                .map((r) => (
                  <article className="revision-row" key={r.id}>
                    <div>
                      <h3>{r.data.title}</h3>
                      <p>
                        {r.data.pattern} · due {r.data.revision}
                      </p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => {
                        const stage = r.data.stage + 1;
                        return save(
                          "problem",
                          {
                            ...r.data,
                            stage,
                            revision: afterDay(
                              r.data.date,
                              [1, 3, 14, 30, 30][stage],
                            ),
                          },
                          r,
                        );
                      }}
                    >
                      Explained independently <Check size={15} />
                    </button>
                  </article>
                ))}
              {!list("problem").some(
                (r) => r.data.revision <= date && r.data.stage < 4,
              ) && <p className="empty-state">No revisions due today.</p>}
            </TabsContent>
            <TabsContent value="history">
              <label className="search-field">
                <span>Find a problem or pattern</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your practice history…"
                />
              </label>
              {cards("problem", (r) =>
                (r.data.title + " " + r.data.pattern)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
      {page === "Build" && (
        <>
          <div className="project-banner">
            <span className="eyebrow">YOUR ONE ACTIVE PRODUCT</span>
            <h2>Pinterest-inspired search & recommendations</h2>
            <p>
              Ruby → Rails → APIs → retrieval → ranking. Start with your own,
              sample, or authorized data; access to Pinterest is not assumed.
            </p>
            <button
              className="button primary"
              onClick={() =>
                add("task", { lane: "Build", project: "Personal" })
              }
            >
              Add next build task
            </button>
          </div>
          <div className="build-grid">
            {buildMilestones.map(([id, title, description]) => {
              const r = list("milestone").find((r) =>
                r.data.title.startsWith(id + " ·"),
              );
              return (
                <article className="record-card" key={id}>
                  <span className="phase-marker">{id}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <button
                    className="text-button"
                    onClick={() =>
                      edit({
                        kind: "milestone",
                        record: r,
                        initial: { title: id + " · " + title },
                      })
                    }
                  >
                    {r?.data.done
                      ? "✓ Shipped"
                      : r
                        ? "Update milestone"
                        : "Record progress"}{" "}
                    <ChevronRight size={14} />
                  </button>
                  {r?.data.note && <p>{r.data.note}</p>}
                </article>
              );
            })}
          </div>
          <h2 className="subhead">Build queue</h2>
          {cards("task", (r) => r.data.lane === "Build")}
        </>
      )}
      {page === "Body + life" && (
        <Tabs defaultValue="body">
          <TabsList>
            <TabsTrigger value="body">Body & recovery</TabsTrigger>
            <TabsTrigger value="life">Life outside work</TabsTrigger>
          </TabsList>
          <TabsContent value="body">
            <div className="notice">
              <Activity size={20} />
              <p>
                Strong + athletic + healthy. A rest day is a valid training
                decision. No calorie punishment, compensatory workouts, or
                weight-loss deadlines.
              </p>
              <button className="button primary" onClick={() => add("health")}>
                Daily check-in
              </button>
            </div>
            <div className="health-guide">
              <h3>A sustainable baseline</h3>
              <p>
                Adults generally benefit from 150–300 minutes of moderate
                aerobic activity per week, or the vigorous equivalent, plus
                strengthening on at least two days. Build around your current
                capacity and recovery.
              </p>
              <a
                href="https://www.who.int/news-room/fact-sheets/detail/physical-activity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-button"
              >
                WHO activity guidance <ArrowUpRight size={14} />
              </a>
              <p>
                Log sleep and energy before adding intensity. If you feel unwell
                or have persistent pain, pause and get appropriate medical
                advice.
              </p>
            </div>
            {cards("health")}
          </TabsContent>
          <TabsContent value="life">
            <div className="notice">
              <p>
                Friends, music, Veer, a walk, a movie. This space does not need
                an achievement metric.
              </p>
              <button className="button primary" onClick={() => add("life")}>
                Make time for life
              </button>
            </div>
            {cards("life")}
          </TabsContent>
        </Tabs>
      )}
      {page === "Knowledge" && (
        <>
          <div className="notice">
            <p>
              Write the idea, an example, and the project it connects to. Avoid
              collecting notes you never use.
            </p>
            <button className="button primary" onClick={() => add("note")}>
              New note
            </button>
          </div>
          <label className="search-field">
            <span>Search knowledge</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ruby, architecture, a project…"
            />
          </label>
          {cards("note", (r) =>
            JSON.stringify(r.data).toLowerCase().includes(query.toLowerCase()),
          )}
        </>
      )}
      {page === "Reviews" && (
        <>
          <div className="review-prompts">
            <article>
              <span className="eyebrow">EVERY WEEK</span>
              <h3>What moved? What can go?</h3>
              <p>
                Reflect on work, DSA, building, recovery, and life. Remove one
                source of noise.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  add("review", { period: "Weekly", title: "Week of " + date })
                }
              >
                Start weekly review
              </button>
            </article>
            <article>
              <span className="eyebrow">EVERY MONTH / QUARTER</span>
              <h3>Is your life getting better?</h3>
              <p>
                Review capability, market value, money, health, and enjoyment.
                Adjust the plan from evidence.
              </p>
              <button
                className="button secondary"
                onClick={() =>
                  add("review", {
                    period: "Monthly",
                    title: "Monthly review · " + date,
                  })
                }
              >
                Start deeper review
              </button>
            </article>
          </div>
          {cards("review")}
        </>
      )}
      {page === "Not now" && (
        <>
          <div className="notice">
            <Pause size={20} />
            <p>
              Random certifications. A fifth language. Another side project.
              Nothing here enters your schedule without replacing an active
              priority.
            </p>
            <button className="button primary" onClick={() => add("backlog")}>
              <Plus size={15} /> Park an idea
            </button>
          </div>
          {cards("backlog")}
        </>
      )}
      {page === "Career + money" && (
        <Tabs defaultValue="evidence">
          <TabsList>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="cert">Certifications</TabsTrigger>
            <TabsTrigger value="money">Money</TabsTrigger>
            <TabsTrigger value="decision">Decisions</TabsTrigger>
          </TabsList>
          {(["evidence", "cert", "money", "decision"] as Kind[]).map((kind) => (
            <TabsContent key={kind} value={kind}>
              <div className="notice">
                <p>
                  {kind === "cert"
                    ? "CSA and CAD completed, per your brief. Keep only one new certification active."
                    : kind === "money"
                      ? "Starting context: approximately ₹3.75 LPA at KeenStack, previously ₹9 LPA at TCS. Log updates to build your history."
                      : kind === "decision"
                        ? "Capture evidence and a review date. You do not need to reopen major decisions every two days."
                        : "Starting evidence from your brief: Keystone hackathon win, Stack Intelligence AI award, Sonora AI estimation, and demo leadership."}
                </p>
                <button className="button primary" onClick={() => add(kind)}>
                  Add {kindLabels[kind].toLowerCase()}
                </button>
              </div>
              {cards(kind)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  );
}
