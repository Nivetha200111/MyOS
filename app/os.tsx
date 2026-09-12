"use client";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Command as CommandBox,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Editor, type EditTarget } from "./editor";
import { View } from "./views";
import { useWorkspace } from "./use-workspace";
import { day, afterDay, type RecordItem } from "@/lib/model";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  Flame,
  Headphones,
  LayoutDashboard,
  ListTodo,
  LockKeyhole,
  Mountain,
  Pause,
  Play,
  Plus,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Volume2,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
const nav = [
  ["Command center", LayoutDashboard],
  ["Today", ListTodo],
  ["Active goals", Target],
  ["Work", BriefcaseBusiness],
  ["LeetCode", Code2],
  ["Build", Rocket],
  ["Body + life", Activity],
  ["Knowledge", BookOpen],
  ["Reviews", Radar],
  ["Not now", Pause],
  ["Career + money", Mountain],
] as const;
const priorities = [
  [
    "WORK",
    "Define the next Sonora deliverable",
    "One concrete outcome. Clear acceptance criteria.",
    "45 min",
  ],
  [
    "LEETCODE",
    "Understand one array / hash map problem",
    "Python · Explain the approach and complexity.",
    "30 min",
  ],
  [
    "BUILD",
    "Sketch the search API for your Rails project",
    "One endpoint. One small, shippable step.",
    "30 min",
  ],
];
const routes: Record<string, string> = {
  "Command center": "/",
  Today: "/today",
  "Active goals": "/goals",
  Work: "/work",
  LeetCode: "/leetcode",
  Build: "/build",
  "Body + life": "/fitness",
  Knowledge: "/knowledge",
  Reviews: "/reviews",
  "Not now": "/backlog",
  "Career + money": "/career",
};
export default function OS() {
  const [page, changePage] = useState("Command center");
  const [editor, setEditor] = useState<EditTarget | null>(null);
  const [command, setCommand] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null);
  const [now, setNow] = useState(Date.now());
  const { records, status, ready, busy, reload, save, remove } = useWorkspace();
  const date = day(new Date(now));
  const tasks = records.filter(
    (r) => r.kind === "task" && r.data.date === date && r.data.priority,
  );
  const completed = tasks.filter((r) => r.data.done).length;
  const active = records.filter(
    (r) => r.kind === "goal" && r.data.status === "Active",
  ).length;
  const practiced = new Set(
    records.filter((r) => r.kind === "problem").map((r) => r.data.pattern),
  ).size;
  const latestHealth = records
    .filter((r) => r.kind === "health")
    .sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
  const session = records.find(
    (r) => r.kind === "focus" && r.data.status === "Running",
  );
  const focused = records
    .filter(
      (r) =>
        r.kind === "focus" &&
        r.data.status === "Complete" &&
        day(new Date(r.data.started)) === date,
    )
    .reduce((n, r) => n + r.data.minutes, 0);
  const due = records.filter(
    (r) => r.kind === "problem" && r.data.revision <= date && r.data.stage < 4,
  ).length;
  const remaining = session
    ? Math.max(0, Math.ceil((session.data.end - now) / 1000))
    : 0;
  const streak = (kind: string) => {
    const dates = new Set(
      records.filter((r) => r.kind === kind).map((r) => r.data.date),
    );
    let cursor = dates.has(date) ? date : afterDay(date, -1);
    let count = 0;
    while (dates.has(cursor)) {
      count++;
      cursor = afterDay(cursor, -1);
    }
    return count;
  };
  const days = Math.max(
    0,
    Math.floor((Date.parse(date) - Date.parse("2026-09-01")) / 86400000),
  );
  const setPage = (name: string) => {
    changePage(name);
    window.history.pushState({}, "", routes[name] || "/");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const sync = () =>
      changePage(
        Object.keys(routes).find((k) => routes[k] === location.pathname) ||
          "Command center",
      );
    sync();
    window.addEventListener("popstate", sync);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      clearInterval(timer);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  const briefing =
    latestHealth?.data.date === date && latestHealth.data.energy === "Low"
      ? "Your energy is low today. Reduce the load. Choose one essential outcome and make room for recovery."
      : tasks.length
        ? `You have ${tasks.length - completed} ${tasks.length - completed === 1 ? "priority" : "priorities"} remaining. ${tasks.find((r) => !r.data.done)?.data.title || "Your big three are complete. Protect your evening."} ${due ? `${due} problem revisions are due.` : ""}`
        : "Today, protect your focus: one work outcome, one problem understood, one step toward your own product.";
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      toast.info("Spoken briefings are unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(
      "Hello Nivetha. " +
        briefing +
        " Discipline includes knowing when to stop.",
    );
    speech.rate = 0.93;
    window.speechSynthesis.speak(speech);
  };
  const startFocus = () => {
    setFocusOpen(true);
    if (!session)
      setEditor({
        kind: "focus",
        initial: {
          title:
            tasks.find((r) => !r.data.done)?.data.title ||
            "One meaningful outcome",
        },
      });
  };
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: "Nivetha OS", exported: new Date().toISOString(), records },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nivetha-os-" + date + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  useEffect(() => {
    const mc = (document as any).modelContext;
    if (!mc?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        mc.registerTool(
          {
            name: "inspect_nivetha_focus",
            title: "Inspect Nivetha’s focus",
            description:
              "Read active goals and today’s priorities from the visible workspace.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                Object.keys(input).length
              )
                throw Error("Expected an empty object");
              return {
                date,
                goals: records.filter(
                  (r) => r.kind === "goal" && r.data.status === "Active",
                ),
                priorities: tasks,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [records, date]);
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "232px" } as React.CSSProperties}
    >
      <Sidebar className="os-sidebar">
        <SidebarHeader>
          <a className="brand" href="/">
            <span className="brand-mark">N</span>
            <span>
              NIVETHA<span className="brand-os"> OS</span>
              <small>PERSONAL OPERATING SYSTEM</small>
            </span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">YOUR CONTROL CENTER</div>
          <SidebarMenu>
            {nav.map(([name, Icon], i) => (
              <SidebarMenuItem key={name}>
                <SidebarMenuButton
                  isActive={page === name}
                  onClick={() => setPage(name)}
                  className="nav-button"
                >
                  <Icon />
                  <span>{name}</span>
                  {i === 2 && <span className="nav-count">{active}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-mission">
            <Mountain size={22} />
            <p>The two-year mission</p>
            <span>September 2026 → 2028</span>
            <Progress
              value={Math.min(100, (days / 730) * 100)}
              aria-label="Time elapsed in two-year plan"
            />
            <small>Build fewer things. Finish more.</small>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="profile">
            <span className="avatar">N</span>
            <div>
              Nivetha<small>Engineer. Builder. Becoming.</small>
            </div>
            <ShieldCheck size={17} />
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="main-shell">
        <Toaster richColors theme="dark" />
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger />
            <span>My workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <button
            className="top-meta command-trigger"
            onClick={() => setCommand(true)}
          >
            <Command size={14} /> Ask ORBIT <kbd>⌘ K</kbd>
          </button>
        </header>
        <div className="page-content">
          {!ready && (
            <div className="notice">
              <p>{status}</p>
              <button className="button secondary" onClick={reload}>
                Retry
              </button>
              <a
                className="text-button"
                href="/signin-with-chatgpt?return_to=/"
                target="_top"
              >
                Sign in
              </a>
            </div>
          )}
          {page !== "Command center" ? (
            <View
              key={page}
              page={page}
              records={records}
              edit={setEditor}
              save={save}
              remove={setDeleteTarget}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {new Intl.DateTimeFormat("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })
                      .format(new Date(now))
                      .toUpperCase()}
                  </p>
                  <h1>
                    Your next chapter starts today<span>.</span>
                  </h1>
                  <p>
                    Less noise. More intention. One meaningful day at a time.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => setCommand(true)}
                >
                  <Plus size={16} /> Quick capture
                </button>
              </div>
              <section className="briefing">
                <div className="briefing-copy">
                  <span className="chip">
                    <Sparkles size={13} /> ORBIT · YOUR DAILY BRIEFING
                  </span>
                  <h2>
                    You have the drive.
                    <br />
                    Let’s give it direction.
                  </h2>
                  <p>{briefing}</p>
                  <div className="briefing-actions">
                    <button
                      className="button primary"
                      onClick={() => setPage("Today")}
                    >
                      <Play size={15} fill="currentColor" /> Begin your day
                    </button>
                    <button className="text-button" onClick={speak}>
                      <Volume2 size={17} /> Listen to briefing
                    </button>
                  </div>
                </div>
                <div className="orb-scene" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="orb">
                    <div className="orb-core" />
                  </div>
                  <span className="orb-caption">FOCUS IS YOUR SUPERPOWER</span>
                  <span className="orb-coord">
                    N / 01 &nbsp; — &nbsp; SYSTEM READY
                  </span>
                </div>
              </section>
              <div className="stat-grid">
                {[
                  [
                    Target,
                    "Active goals",
                    String(active),
                    "/ 4",
                    "Capacity protected",
                    "mint",
                  ],
                  [
                    Code2,
                    "Patterns practiced",
                    String(practiced),
                    "/ 21",
                    "Depth over problem count",
                    "blue",
                  ],
                  [
                    Timer,
                    "Focused today",
                    String(focused),
                    "min",
                    "Make room for deep work",
                    "purple",
                  ],
                  [
                    Activity,
                    "Recovery",
                    latestHealth?.data.date === date
                      ? latestHealth.data.energy
                      : "—",
                    "",
                    latestHealth?.data.date === date
                      ? latestHealth.data.sleep + "h sleep logged"
                      : "Start with a check-in",
                    "peach",
                  ],
                ].map(([Icon, label, value, unit, note, color]: any) => (
                  <article className="stat-card" key={label}>
                    <div className="stat-label">
                      <span>{label}</span>
                      <Icon className={color} size={18} />
                    </div>
                    <div className="stat-value">
                      {value}
                      <small>{unit}</small>
                    </div>
                    <p>{note}</p>
                  </article>
                ))}
              </div>
              <div className="rhythm-bar">
                <Flame size={15} />
                <span>
                  LeetCode{" "}
                  <strong>
                    {streak("problem")} day{streak("problem") === 1 ? "" : "s"}
                  </strong>
                </span>
                <span>
                  Body check-ins{" "}
                  <strong>
                    {streak("health")} day{streak("health") === 1 ? "" : "s"}
                  </strong>
                </span>
                <small>A missed day is a restart, not a verdict.</small>
              </div>
              <div className="dashboard-columns">
                <section className="panel priorities">
                  <div className="section-heading">
                    <div>
                      <h2>Today’s big three</h2>
                      <p>Everything else can wait.</p>
                    </div>
                    <span className="small-badge">
                      {completed} / {tasks.length} complete
                    </span>
                  </div>
                  {tasks.map((task, i) => (
                    <div
                      key={task.id}
                      className={
                        "priority-row " + (task.data.done ? "completed" : "")
                      }
                    >
                      <Checkbox
                        aria-label={"Complete " + task.data.title}
                        checked={task.data.done}
                        disabled={busy}
                        onCheckedChange={(v) =>
                          save("task", { ...task.data, done: v === true }, task)
                        }
                      />
                      <div>
                        <span className={"task-tag tag-" + i}>
                          {task.data.lane.toUpperCase()}
                        </span>
                        <h3>
                          <button
                            className="task-edit"
                            onClick={() =>
                              setEditor({ kind: "task", record: task })
                            }
                          >
                            {task.data.title}
                          </button>
                        </h3>
                        <p>{task.data.project} · One meaningful outcome.</p>
                      </div>
                      <button
                        className="text-button"
                        aria-label={"Focus on " + task.data.title}
                        onClick={() =>
                          session
                            ? setFocusOpen(true)
                            : setEditor({
                                kind: "focus",
                                initial: {
                                  title: task.data.title,
                                  minutes: Math.min(task.data.minutes, 90),
                                },
                              })
                        }
                      >
                        <Play size={14} />
                      </button>
                      <span className="duration">{task.data.minutes} min</span>
                    </div>
                  ))}
                  {tasks.length < 3 && (
                    <div className="suggestions">
                      <p className="eyebrow">
                        {tasks.length
                          ? "ROOM FOR ANOTHER OUTCOME"
                          : "SUGGESTED STARTING POINTS · CHOOSE YOUR OWN"}
                      </p>
                      {priorities
                        .slice(0, 3 - tasks.length)
                        .map(([tag, title, desc, time], i) => (
                          <button
                            key={title}
                            className="suggestion"
                            onClick={() =>
                              setEditor({
                                kind: "task",
                                initial: {
                                  title,
                                  lane:
                                    tag === "WORK"
                                      ? "Work"
                                      : tag === "BUILD"
                                        ? "Build"
                                        : "LeetCode",
                                  project:
                                    tag === "WORK"
                                      ? "Client · Sonora"
                                      : "Personal",
                                  priority: true,
                                  minutes: parseInt(time),
                                },
                              })
                            }
                          >
                            <Plus size={15} />
                            <span>{title}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  <div className="panel-footer">
                    <ShieldCheck size={15} /> Three priorities. A finish line
                    you can actually reach.
                  </div>
                </section>
                <section className="panel north-star">
                  <span className="eyebrow">YOUR NORTH STAR</span>
                  <Mountain size={27} />
                  <h2>
                    Strong engineer.
                    <br />
                    Strong body.
                    <br />
                    <em>A life of your own.</em>
                  </h2>
                  <p>
                    Enterprise depth. Algorithmic fluency. Products you can
                    ship. Energy to enjoy it all.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setPage("Active goals")}
                  >
                    Explore your two-year path <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <div className="section-heading goals-heading">
                <div>
                  <h2>Four lanes. One direction.</h2>
                  <p>Keep the promises you chose. Park the rest.</p>
                </div>
                <span className="eyebrow">FOCUS LIMIT: {active} / 4</span>
              </div>
              <div className="lane-grid">
                {[
                  [
                    BriefcaseBusiness,
                    "01",
                    "Work",
                    "Enterprise AI + Sonora",
                    "mint",
                  ],
                  [
                    Code2,
                    "02",
                    "LeetCode",
                    "Python · patterns, not points",
                    "blue",
                  ],
                  [
                    Rocket,
                    "03",
                    "Build",
                    "Ruby / Rails · search + ranking",
                    "purple",
                  ],
                  [
                    Activity,
                    "04",
                    "Body + Life",
                    "Strength, recovery, connection",
                    "peach",
                  ],
                ].map(([Icon, num, title, desc, color]: any) => (
                  <button
                    className="lane"
                    key={title}
                    onClick={() =>
                      setPage(title === "Body + Life" ? "Body + life" : title)
                    }
                  >
                    <div>
                      <Icon size={21} className={color} />
                      <span>{num}</span>
                    </div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="utility-bar">
            <span className={status.includes("failed") ? "peach" : "muted"}>
              <LockKeyhole size={13} /> {status}
            </span>
            <button className="text-button" onClick={startFocus}>
              <Timer size={15} />
              {session
                ? "Resume focus · " +
                  String(Math.floor(remaining / 60)).padStart(2, "0") +
                  ":" +
                  String(remaining % 60).padStart(2, "0")
                : "Enter focus mode"}
            </button>
            <button
              className="text-button"
              onClick={exportData}
              disabled={!ready}
            >
              Export my data
            </button>
            <a
              className="text-button"
              href="/downloads/Nivetha-OS.apk"
              download
            >
              Android APK ↗
            </a>
          </div>
          <footer className="page-footer">
            <span>
              <ShieldCheck size={14} /> Discipline includes knowing when to
              stop.
            </span>
            <span>NIVETHA OS / V1.0</span>
          </footer>
        </div>
      </main>
      {editor && (
        <Editor
          key={
            editor.record?.id || editor.kind + JSON.stringify(editor.initial)
          }
          target={editor}
          close={() => setEditor(null)}
          save={save}
        />
      )}
      <Dialog open={command} onOpenChange={setCommand}>
        <DialogContent className="command-modal">
          <DialogTitle>ORBIT command center</DialogTitle>
          <DialogDescription>
            Quick actions and spoken briefings. ORBIT follows your plan; it is
            not an open-ended AI chatbot.
          </DialogDescription>
          <CommandBox>
            <CommandInput placeholder="Find a page or action…" />
            <CommandList>
              <CommandEmpty>
                No match. Try “focus”, “problem”, or “review”.
              </CommandEmpty>
              <CommandGroup heading="Do the next thing">
                {[
                  ["Listen to my briefing", () => speak()],
                  ["Start a focus session", startFocus],
                  [
                    "Add a daily priority",
                    () =>
                      setEditor({ kind: "task", initial: { priority: true } }),
                  ],
                  [
                    "Log a LeetCode problem",
                    () => setEditor({ kind: "problem" }),
                  ],
                  [
                    "Check in with my body",
                    () => setEditor({ kind: "health" }),
                  ],
                  [
                    "Park an idea in Not now",
                    () => setEditor({ kind: "backlog" }),
                  ],
                  [
                    "Write a weekly review",
                    () =>
                      setEditor({
                        kind: "review",
                        initial: { period: "Weekly", title: "Week of " + date },
                      }),
                  ],
                ].map(([label, action]: any) => (
                  <CommandItem
                    key={label}
                    onSelect={() => {
                      setCommand(false);
                      action();
                    }}
                  >
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Navigate">
                {nav.map(([name, Icon]) => (
                  <CommandItem
                    key={name}
                    onSelect={() => {
                      setPage(name);
                      setCommand(false);
                    }}
                  >
                    <Icon size={15} />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandBox>
        </DialogContent>
      </Dialog>
      <Dialog
        open={focusOpen && !editor && !!session}
        onOpenChange={setFocusOpen}
      >
        <DialogContent className="focus-modal">
          <DialogTitle>One thing. Your full attention.</DialogTitle>
          <DialogDescription>{session?.data.title}</DialogDescription>
          <div className="focus-clock">
            {String(Math.floor(remaining / 60)).padStart(2, "0")}
            <span>:</span>
            {String(remaining % 60).padStart(2, "0")}
          </div>
          <p>
            {remaining
              ? "Give this outcome your attention. The session keeps time when you change tabs."
              : "Time box complete. Record the session, then take a break."}
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                if (
                  session &&
                  (await save(
                    "focus",
                    { ...session.data, status: "Cancelled" },
                    session,
                  ))
                )
                  setFocusOpen(false);
              }}
            >
              End without logging
            </button>
            <button
              className="button primary"
              disabled={!!remaining || busy}
              onClick={async () => {
                if (
                  session &&
                  (await save(
                    "focus",
                    { ...session.data, status: "Complete" },
                    session,
                  ))
                ) {
                  setFocusOpen(false);
                  toast.success("Focus session recorded. Take a break.");
                }
              }}
            >
              Record completed session
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !busy && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes “{deleteTarget?.data.title || deleteTarget?.data.date}”
            from your synced workspace.
          </AlertDialogDescription>
          <div className="form-actions">
            <AlertDialogCancel disabled={busy}>Keep entry</AlertDialogCancel>
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                if (deleteTarget && (await remove(deleteTarget)))
                  setDeleteTarget(null);
              }}
            >
              Delete entry
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
