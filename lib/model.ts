import { z } from "zod";
const text = z.string().trim().max(6000);
const title = z.string().trim().min(1).max(250);
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
  );
const optionalNumber = z.union([z.number().finite(), z.literal("")]).optional();
export const patterns = [
  "Arrays",
  "Strings",
  "Hash Maps",
  "Sets",
  "Two Pointers",
  "Sliding Window",
  "Prefix Sum",
  "Stack",
  "Queue",
  "Linked List",
  "Binary Search",
  "Intervals",
  "Trees",
  "BST",
  "Recursion",
  "Heap",
  "Graphs",
  "BFS / DFS",
  "Topological Sort",
  "Backtracking",
  "Dynamic Programming",
];
export const lanes = ["Work", "LeetCode", "Build", "Body + Life"];
export const schemas = {
  goal: z.object({
    title,
    lane: z.enum(["Work", "LeetCode", "Build", "Body + Life"]),
    description: text,
    status: z.enum(["Active", "Paused", "Complete"]),
    metric: text,
  }),
  task: z.object({
    title,
    lane: z.enum(["Work", "LeetCode", "Build", "Body + Life"]),
    project: z.enum(["Client · Sonora", "Internal · KeenStack", "Personal"]),
    date: daySchema,
    minutes: z.number().int().min(5).max(480),
    priority: z.boolean(),
    done: z.boolean(),
  }),
  problem: z.object({
    title,
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    pattern: z.enum(patterns as [string, ...string[]]),
    date: daySchema,
    independent: z.boolean(),
    hints: z.boolean(),
    complexity: text,
    mistake: text,
    insight: text,
    revision: daySchema,
    stage: z.number().int().min(0).max(4),
  }),
  pattern: z.object({
    title: z.enum(patterns as [string, ...string[]]),
    confidence: z.enum([
      "Not started",
      "Learned",
      "Weak",
      "Comfortable",
      "Revision required",
    ]),
  }),
  health: z.object({
    date: daySchema,
    sleep: z.number().min(0).max(24),
    energy: z.enum(["Low", "Steady", "High"]),
    activity: z.enum([
      "Rest / recovery",
      "Strength",
      "Walk",
      "Run",
      "Ruck",
      "Class",
      "Mobility",
    ]),
    minutes: z.number().min(0).max(600),
    distance: z.number().min(0).max(200),
    weight: optionalNumber,
    restingHR: optionalNumber,
    hrv: optionalNumber,
    strength: text,
    notes: text,
  }),
  note: z.object({
    title,
    category: z.enum([
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
    project: text,
    content: text,
  }),
  review: z.object({
    title,
    period: z.enum(["Weekly", "Monthly", "Quarterly"]),
    date: daySchema,
    work: text,
    learning: text,
    patterns: text,
    shipped: text,
    health: text,
    life: text,
    remove: text,
    money: text,
    next: text,
  }),
  backlog: z.object({
    title,
    category: z.enum([
      "Career",
      "Certification",
      "Project",
      "Learning",
      "Life",
    ]),
    reason: text,
    reconsider: daySchema,
  }),
  evidence: z.object({
    title,
    date: daySchema,
    project: text,
    impact: text,
    metric: text,
    link: z.union([
      z
        .string()
        .url()
        .refine((v) => /^https?:/.test(v)),
      z.literal(""),
    ]),
  }),
  cert: z.object({
    title,
    status: z.enum(["Queued", "Active", "Complete"]),
    syllabus: text,
    progress: z.number().min(0).max(100),
    score: z.number().min(0).max(100),
    exam: z.union([daySchema, z.literal("")]),
  }),
  milestone: z.object({ title, done: z.boolean(), note: text }),
  life: z.object({
    title,
    date: daySchema,
    category: z.enum([
      "Friends",
      "Family / Veer",
      "Music",
      "Travel",
      "Community",
      "Just for me",
    ]),
    done: z.boolean(),
    notes: text,
  }),
  decision: z.object({
    title,
    reason: text,
    alternative: text,
    review: daySchema,
  }),
  money: z.object({
    title,
    date: daySchema,
    salary: z.number().min(0),
    savings: z.number().min(0),
    expenses: z.number().min(0),
    target: z.number().min(0),
    notes: text,
  }),
  focus: z.object({
    title,
    started: z.number(),
    end: z.number(),
    minutes: z.number().min(5).max(90),
    status: z.enum(["Running", "Complete", "Cancelled"]),
  }),
};
export type Kind = keyof typeof schemas;
export type RecordItem = {
  id: string;
  kind: Kind;
  data: Record<string, any>;
  version: number;
  updated: number;
};
export function day(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function afterDay(date: string, n: number) {
  return new Date(Date.parse(date + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
}
export const defaults = [
  [
    "Work",
    "Deliver reliable enterprise AI",
    "Sonora delivery + demo leadership. Capture engineering outcomes.",
    "One measurable delivery outcome each week.",
  ],
  [
    "LeetCode",
    "Build algorithmic fluency",
    "Python for DSA. Understand, explain, and revisit.",
    "150–200 understood problems by March 2027; adjust at reviews.",
  ],
  [
    "Build",
    "Ship a search + recommendation product",
    "Learn Ruby and Rails by building one complete product.",
    "One deployed project with real engineering trade-offs.",
  ],
  [
    "Body + Life",
    "Become strong, athletic, and well",
    "Strength, cardiovascular fitness, recovery, and time outside work.",
    "Sustainable activity, sleep, and one meaningful connection each week.",
  ],
];
export const roadmap = [
  [
    "Q1",
    "Sep – Nov 2026",
    "Build your foundation",
    "Establish a sustainable week. Arrays, hashing, two pointers. Rails search V0. Capture Sonora outcomes.",
  ],
  [
    "Q2",
    "Dec 2026 – Feb 2027",
    "Turn practice into fluency",
    "Trees, heaps, graphs. Ship a deployed Rails API with tests. Review compensation evidence and training recovery.",
  ],
  [
    "Q3",
    "Mar – May 2027",
    "Make the work visible",
    "Review the 150–200 problem milestone for understanding. Add ranking and caching. Write two sanitized project case studies.",
  ],
  [
    "Q4",
    "Jun – Aug 2027",
    "Test your market readiness",
    "Practice unfamiliar interview problems and system design. Get resume feedback. Review career paths and fitness trends.",
  ],
  [
    "Q5",
    "Sep – Nov 2027",
    "Go deeper, selectively",
    "Pick one engineering gap based on evidence. Add recommendation evaluation. Start targeted networking and mock interviews.",
  ],
  [
    "Q6",
    "Dec 2027 – Feb 2028",
    "Build credible options",
    "Make targeted applications when ready. Compare roles on growth, compensation, and life. Keep a sustainable training routine.",
  ],
  [
    "Q7",
    "Mar – May 2028",
    "Convert capability into opportunity",
    "Use interview feedback to close gaps. Reassess internal growth or relocation with concrete terms. Preserve recovery and relationships.",
  ],
  [
    "Q8",
    "Jun – Aug 2028",
    "Choose your next chapter",
    "Assess engineering capability, career options, and health trends. Choose the next direction from evidence, not urgency.",
  ],
];
export const buildMilestones = [
  [
    "V0",
    "Search that works",
    "Rails app, search form, a permitted data source, and deployed results.",
  ],
  [
    "V1",
    "Understand the query",
    "Parse intent, normalize queries, and test ambiguous inputs.",
  ],
  [
    "V2",
    "Expand intent",
    "Generate related concepts and measure whether retrieval improves.",
  ],
  [
    "V3",
    "Rank with evidence",
    "Define relevance criteria. Compare a baseline and a ranking method.",
  ],
  [
    "V4",
    "Make it personal",
    "Persist explicit preferences with controls to edit and reset them.",
  ],
  [
    "V5",
    "Recommend thoughtfully",
    "Add recommendations, evaluations, caching, and documented trade-offs.",
  ],
];
