"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  day,
  afterDay,
  patterns,
  lanes,
  type Kind,
  type RecordItem,
} from "@/lib/model";
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  value?: any;
  required?: boolean;
  min?: number;
  max?: number;
};
const t = (
  key: string,
  label: string,
  value = "",
  required = false,
): Field => ({ key, label, value, required });
const a = (key: string, label: string): Field => ({
  key,
  label,
  type: "textarea",
});
const s = (
  key: string,
  label: string,
  options: string[],
  value = options[0],
): Field => ({ key, label, type: "select", options, value });
const n = (key: string, label: string, value = 0, max = 10000000): Field => ({
  key,
  label,
  type: "number",
  value,
  min: 0,
  max,
});
const d = (key: string, label: string, value = day()): Field => ({
  key,
  label,
  type: "date",
  value,
  required: true,
});
const b = (key: string, label: string, value = false): Field => ({
  key,
  label,
  type: "boolean",
  value,
});
export const fields: Record<Kind, Field[]> = {
  goal: [
    t("title", "Goal", "", true),
    s("lane", "Lane", lanes),
    a("description", "Why this matters"),
    a("metric", "What evidence will show progress?"),
    s("status", "Status", ["Active", "Paused", "Complete"]),
  ],
  task: [
    t("title", "One concrete outcome", "", true),
    s("lane", "Lane", lanes),
    s("project", "Workspace", [
      "Client · Sonora",
      "Internal · KeenStack",
      "Personal",
    ]),
    d("date", "Scheduled date"),
    { ...n("minutes", "Time box (minutes)", 30, 480), min: 5 },
    b("priority", "Make this one of my daily big three"),
    b("done", "Completed"),
  ],
  problem: [
    t("title", "Problem title", "", true),
    s("difficulty", "Difficulty", ["Easy", "Medium", "Hard"]),
    s("pattern", "Pattern", patterns),
    d("date", "Date practiced"),
    b("independent", "Solved independently"),
    b("hints", "Used hints"),
    t("complexity", "Time and space complexity", "", true),
    a("mistake", "Mistake / sticking point"),
    {
      ...a("insight", "Key insight — explain it in your own words"),
      required: true,
    },
    d("revision", "Next revision", afterDay(day(), 1)),
    { key: "stage", label: "Revision stage", type: "hidden", value: 0 },
  ],
  pattern: [
    s("title", "Pattern", patterns),
    s("confidence", "Confidence", [
      "Not started",
      "Learned",
      "Weak",
      "Comfortable",
      "Revision required",
    ]),
  ],
  health: [
    d("date", "Check-in date"),
    n("sleep", "Sleep (hours)", 8, 24),
    s("energy", "Energy", ["Low", "Steady", "High"], "Steady"),
    s("activity", "Activity", [
      "Rest / recovery",
      "Strength",
      "Walk",
      "Run",
      "Ruck",
      "Class",
      "Mobility",
    ]),
    n("minutes", "Activity (minutes)", 0, 600),
    n("distance", "Distance (km)", 0, 200),
    { ...n("weight", "Weight (kg, optional)", 0, 400), value: "" },
    { ...n("restingHR", "Resting heart rate (optional)", 0, 250), value: "" },
    { ...n("hrv", "HRV in ms (optional)", 0, 500), value: "" },
    t("strength", "Strength benchmark (optional)"),
    a("notes", "Recovery / how it felt"),
  ],
  note: [
    t("title", "Note title", "", true),
    s("category", "Topic", [
      "Ruby",
      "Rails",
      "Python",
      "DSA",
      "System Design",
      "ServiceNow",
      "CMDB",
      "AI Agents",
      "Recommendation Systems",
    ]),
    t("project", "Linked project"),
    { ...a("content", "Durable insight and an example"), required: true },
  ],
  review: [
    t("title", "Review title", "", true),
    s("period", "Review cadence", ["Weekly", "Monthly", "Quarterly"]),
    d("date", "Review date"),
    a("work", "What actually moved at work?"),
    a("learning", "What can you do now that you could not before?"),
    a("patterns", "Which DSA patterns improved?"),
    a("shipped", "What feature shipped?"),
    a("health", "Did you train sustainably and recover?"),
    a("life", "What did you enjoy outside work?"),
    { ...a("remove", "What will you stop doing?"), required: true },
    a("money", "Is your market value / financial position improving?"),
    { ...a("next", "Choose the next week’s focus"), required: true },
  ],
  backlog: [
    t("title", "Park this idea", "", true),
    s("category", "Category", [
      "Career",
      "Certification",
      "Project",
      "Learning",
      "Life",
    ]),
    a("reason", "Why it interests you / why it can wait"),
    d("reconsider", "Reconsider on", afterDay(day(), 30)),
  ],
  evidence: [
    t("title", "Engineering win", "", true),
    d("date", "Date"),
    t("project", "Project"),
    { ...a("impact", "Problem → action → outcome"), required: true },
    t("metric", "Measured impact (only verified numbers)"),
    { ...t("link", "Evidence link (optional)"), type: "url" },
  ],
  cert: [
    t("title", "Certification", "", true),
    s("status", "Status", ["Queued", "Active", "Complete"]),
    a("syllabus", "Syllabus / study scope"),
    n("progress", "Completion (%)", 0, 100),
    n("score", "Practice test score (%)", 0, 100),
    { ...d("exam", "Exam date (optional)"), value: "", required: false },
  ],
  milestone: [
    t("title", "Milestone", "", true),
    b("done", "Completed"),
    a("note", "Evidence / what shipped"),
  ],
  life: [
    t("title", "Something worth making time for", "", true),
    d("date", "Date"),
    s("category", "Life outside work", [
      "Friends",
      "Family / Veer",
      "Music",
      "Travel",
      "Community",
      "Just for me",
    ]),
    b("done", "Enjoyed it"),
    a("notes", "Notes"),
  ],
  decision: [
    t("title", "What am I choosing?", "", true),
    { ...a("reason", "What evidence supports this?"), required: true },
    a("alternative", "What else could I do?"),
    d("review", "Reconsider on", afterDay(day(), 90)),
  ],
  money: [
    t("title", "Financial checkpoint", "", true),
    d("date", "Date"),
    n("salary", "Annual compensation (₹)", 375000),
    n("savings", "Current savings (₹)"),
    n("expenses", "Monthly recurring expenses (₹)"),
    n("target", "Next annual compensation target (₹)"),
    a("notes", "Context / compensation history"),
  ],
  focus: [
    t("title", "Focus on one outcome", "", true),
    { ...n("minutes", "Duration in minutes", 25, 90), min: 5 },
    { key: "started", label: "", type: "hidden", value: 0 },
    { key: "end", label: "", type: "hidden", value: 0 },
    { key: "status", label: "", type: "hidden", value: "Running" },
  ],
};
export const kindLabels: Record<Kind, string> = {
  goal: "Active goal",
  task: "Task",
  problem: "LeetCode practice",
  pattern: "Pattern confidence",
  health: "Body check-in",
  note: "Knowledge note",
  review: "Review",
  backlog: "Not now",
  evidence: "Career evidence",
  cert: "Certification",
  milestone: "Milestone",
  life: "Life outside work",
  decision: "Decision log",
  money: "Money checkpoint",
  focus: "Focus session",
};
export type EditTarget = {
  kind: Kind;
  record?: RecordItem;
  initial?: Record<string, any>;
};
export function Editor({
  target,
  close,
  save,
}: {
  target: EditTarget;
  close: () => void;
  save: (
    kind: Kind,
    data: Record<string, any>,
    record?: RecordItem,
  ) => Promise<boolean>;
}) {
  const [data, setData] = useState<Record<string, any>>(() =>
    Object.fromEntries(
      fields[target.kind].map((f) => [
        f.key,
        target.record?.data[f.key] ?? target.initial?.[f.key] ?? f.value ?? "",
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(v) => !v && !busy && close()}>
      <DialogContent className="editor-modal">
        <DialogTitle>
          {target.record ? "Edit" : "Add"}{" "}
          {kindLabels[target.kind].toLowerCase()}
        </DialogTitle>
        <DialogDescription>
          {target.kind === "backlog"
            ? "Capture it here. Only activate it by replacing an existing goal."
            : target.kind === "health"
              ? "Track what is useful. Rest counts; there is no punishment for recovery."
              : "Save a clear entry you can return to on any device."}
        </DialogDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const ok = await save(target.kind, data, target.record);
            setBusy(false);
            if (ok) close();
          }}
        >
          <div className="form-grid">
            {fields[target.kind]
              .filter((f) => f.type !== "hidden")
              .map((f) => (
                <label
                  key={f.key}
                  className={f.type === "textarea" ? "field wide" : "field"}
                >
                  <span>
                    {f.label}
                    {f.required ? " *" : ""}
                  </span>
                  {f.type === "select" ? (
                    <Select
                      value={data[f.key]}
                      onValueChange={(v) => setData({ ...data, [f.key]: v })}
                    >
                      <SelectTrigger aria-label={f.label}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "boolean" ? (
                    <Checkbox
                      aria-label={f.label}
                      checked={!!data[f.key]}
                      onCheckedChange={(v) =>
                        setData({ ...data, [f.key]: v === true })
                      }
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      required={f.required}
                      maxLength={6000}
                      value={data[f.key]}
                      onChange={(e) =>
                        setData({ ...data, [f.key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      required={f.required}
                      maxLength={250}
                      min={f.min}
                      max={f.max}
                      step={f.type === "number" ? "any" : undefined}
                      value={data[f.key]}
                      onChange={(e) =>
                        setData({
                          ...data,
                          [f.key]:
                            f.type === "number" && e.target.value !== ""
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : "Save entry"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
