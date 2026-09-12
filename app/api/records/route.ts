import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db";
import { schemas, defaults, type Kind } from "@/lib/model";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return json({ error: "Sign in to open your private workspace." }, 401);
  try {
    const db = database();
    await db.batch(
      defaults.map(([lane, title, description, metric], i) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO records(owner,id,kind,data,version,updated) SELECT ?,?,'goal',?,1,? WHERE (SELECT count(*) FROM records WHERE owner=? AND kind='goal' AND json_extract(data,'$.status')='Active')<4`,
          )
          .bind(
            user.userId,
            "goal-" + i,
            JSON.stringify({
              lane,
              title,
              description,
              metric,
              status: "Active",
            }),
            Date.now(),
            user.userId,
          ),
      ),
    );
    const rows = await db
      .prepare(
        "SELECT id,kind,data,version,updated FROM records WHERE owner=? ORDER BY updated DESC",
      )
      .bind(user.userId)
      .all();
    return json({
      records: rows.results.map((r: any) => ({
        ...r,
        data: JSON.parse(r.data),
      })),
    });
  } catch (e) {
    console.error("Record read failed", e);
    return json(
      { error: "Your workspace could not load. Please try again." },
      503,
    );
  }
}
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Please sign in again." }, 401);
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== new URL(req.url).origin
  )
    return json({ error: "Request origin rejected" }, 403);
  try {
    const raw = await req.text();
    if (raw.length > 30000)
      return json({ error: "This entry is too large." }, 413);
    const body = JSON.parse(raw);
    if (
      typeof body.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(body.id) ||
      !Object.hasOwn(schemas, body.kind) ||
      !Number.isInteger(body.version) ||
      body.version < 0
    )
      return json({ error: "Invalid entry." }, 400);
    const kind = body.kind as Kind;
    const parsed = schemas[kind].safeParse(body.data);
    if (!parsed.success)
      return json(
        {
          error:
            "Please check the fields: " +
            parsed.error.issues
              .map((i) => i.path.join(".") + " " + i.message)
              .join("; "),
        },
        400,
      );
    const data = parsed.data as any;
    const db = database();
    const old = await db
      .prepare("SELECT kind,data,version FROM records WHERE owner=? AND id=?")
      .bind(user.userId, body.id)
      .first<any>();
    if (
      (old && (old.kind !== kind || old.version !== body.version)) ||
      (!old && body.version !== 0)
    )
      return json(
        {
          error: "This entry changed on another device. Reload and try again.",
        },
        409,
      );
    let guard = "1=1";
    let args: unknown[] = [];
    if (kind === "goal" && data.status === "Active") {
      guard = `(SELECT count(*) FROM records WHERE owner=? AND kind='goal' AND id<>? AND json_extract(data,'$.status')='Active')<4`;
      args = [user.userId, body.id];
    }
    if (kind === "cert" && data.status === "Active") {
      guard = `(SELECT count(*) FROM records WHERE owner=? AND kind='cert' AND id<>? AND json_extract(data,'$.status')='Active')<1`;
      args = [user.userId, body.id];
    }
    if (kind === "task" && data.priority) {
      guard = `(SELECT count(*) FROM records WHERE owner=? AND kind='task' AND id<>? AND json_extract(data,'$.priority')=1 AND json_extract(data,'$.date')=?)<3`;
      args = [user.userId, body.id, data.date];
    }
    if (kind === "focus") {
      if (!old) {
        data.started = Date.now();
        data.end = data.started + data.minutes * 60000;
        data.status = "Running";
      } else {
        const previous = JSON.parse(old.data);
        if (
          previous.status !== "Running" ||
          !["Complete", "Cancelled"].includes(data.status)
        )
          return json({ error: "This session is already closed." }, 409);
        if (data.status === "Complete" && Date.now() < previous.end)
          return json(
            { error: "The focus session has not finished yet." },
            400,
          );
        Object.assign(data, {
          started: previous.started,
          end: previous.end,
          minutes: previous.minutes,
        });
      }
      if (data.status === "Running") {
        guard = `(SELECT count(*) FROM records WHERE owner=? AND kind='focus' AND id<>? AND json_extract(data,'$.status')='Running')<1`;
        args = [user.userId, body.id];
      }
    }
    const updated = Date.now();
    const encoded = JSON.stringify(data);
    const result = old
      ? await db
          .prepare(
            `UPDATE records SET data=?,version=version+1,updated=? WHERE owner=? AND id=? AND version=? AND ${guard}`,
          )
          .bind(encoded, updated, user.userId, body.id, body.version, ...args)
          .run()
      : await db
          .prepare(
            `INSERT INTO records(owner,id,kind,data,version,updated) SELECT ?,?,?,?,1,? WHERE ${guard} ON CONFLICT(owner,id) DO NOTHING`,
          )
          .bind(user.userId, body.id, kind, encoded, updated, ...args)
          .run();
    if (!result.meta.changes)
      return json(
        {
          error:
            "Focus limit reached, or the entry changed. Keep at most 4 active goals, 3 daily priorities, 1 certification, and 1 focus session.",
        },
        409,
      );
    return json({
      record: { id: body.id, kind, data, version: body.version + 1, updated },
    });
  } catch (e) {
    console.error("Record write failed", e);
    return json(
      { error: "Could not save. Your draft is still here; please retry." },
      503,
    );
  }
}
export async function DELETE(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Please sign in." }, 401);
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== new URL(req.url).origin
  )
    return json({ error: "Request origin rejected" }, 403);
  try {
    const { id, version } = (await req.json()) as {
      id: string;
      version: number;
    };
    if (typeof id !== "string" || !Number.isInteger(version))
      return json({ error: "Invalid entry" }, 400);
    if (id.startsWith("goal-"))
      return json(
        { error: "Pause or edit a core goal instead of deleting it." },
        400,
      );
    const r = await database()
      .prepare("DELETE FROM records WHERE owner=? AND id=? AND version=?")
      .bind(user.userId, id, version)
      .run();
    return r.meta.changes
      ? json({ ok: true })
      : json({ error: "This entry changed. Reload before deleting." }, 409);
  } catch {
    return json({ error: "Could not delete. Please retry." }, 503);
  }
}
