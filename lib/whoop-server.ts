import { env } from "cloudflare:workers";
import { database } from "@/db";
import type { WhoopRecord, WhoopSnapshot } from "./whoop-data";
const API = "https://api.prod.whoop.com/developer/v2";
export const scopes =
  "offline read:recovery read:cycles read:sleep read:workout";
type Tokens = {
  access_token: string;
  refresh_token: string;
  expiresAt: number;
};
type Connection = {
  owner: string;
  credentials: string | null;
  snapshot: string | null;
  updated: number | null;
};
export class WhoopError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
export function config() {
  const e = env as unknown as Record<string, string | undefined>;
  const clientId = e.WHOOP_CLIENT_ID,
    clientSecret = e.WHOOP_CLIENT_SECRET,
    key = e.WHOOP_TOKEN_KEY,
    redirectUri = e.WHOOP_REDIRECT_URI;
  let validUrl = false;
  try {
    const u = new URL(redirectUri || "");
    validUrl =
      u.pathname === "/api/whoop/callback" &&
      !u.search &&
      !u.hash &&
      !u.username &&
      !u.password &&
      (u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(u.hostname)));
  } catch {}
  return {
    clientId,
    clientSecret,
    key,
    redirectUri,
    configured: !!(
      clientId &&
      clientSecret &&
      key &&
      /^[a-f0-9]{64}$/i.test(key) &&
      validUrl
    ),
  };
}
function requiredConfig() {
  const c = config();
  if (!c.configured)
    throw new WhoopError("Finish WHOOP setup before connecting.", 503);
  return c as {
    clientId: string;
    clientSecret: string;
    key: string;
    redirectUri: string;
    configured: boolean;
  };
}
export async function digest(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function encryptionKey() {
  const c = requiredConfig();
  return crypto.subtle.importKey(
    "raw",
    Uint8Array.from(c.key.match(/../g)!, (x) => parseInt(x, 16)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
async function seal(owner: string, tokens: Tokens) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) },
    await encryptionKey(),
    new TextEncoder().encode(JSON.stringify(tokens)),
  );
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(data)),
  });
}
async function unseal(owner: string, value: string): Promise<Tokens> {
  const { iv, data } = JSON.parse(value);
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: new Uint8Array(iv),
          additionalData: new TextEncoder().encode(owner),
        },
        await encryptionKey(),
        new Uint8Array(data),
      ),
    ),
  );
}
export async function connection(owner: string) {
  return database()
    .prepare(
      "SELECT owner,credentials,snapshot,updated FROM whoop_connections WHERE owner=?",
    )
    .bind(owner)
    .first<Connection>();
}
export async function withLease<T>(
  owner: string,
  action: (lease: string) => Promise<T>,
) {
  const db = database();
  const lease = crypto.randomUUID();
  await db
    .prepare("INSERT OR IGNORE INTO whoop_connections(owner) VALUES(?)")
    .bind(owner)
    .run();
  const locked = await db
    .prepare(
      "UPDATE whoop_connections SET lease=?,lease_until=? WHERE owner=? AND lease_until<? RETURNING owner",
    )
    .bind(lease, Date.now() + 120000, owner, Date.now())
    .first();
  if (!locked)
    throw new WhoopError(
      "WHOOP is already syncing. Try again in a moment.",
      409,
    );
  try {
    return await action(lease);
  } finally {
    await db
      .prepare(
        "UPDATE whoop_connections SET lease=NULL,lease_until=0 WHERE owner=? AND lease=?",
      )
      .bind(owner, lease)
      .run();
  }
}
async function tokenRequest(
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<Tokens> {
  const c = requiredConfig();
  const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...params,
      client_id: c.clientId,
      client_secret: c.clientSecret,
    }),
    signal,
  });
  if (!r.ok)
    throw new WhoopError(
      r.status === 400 || r.status === 401
        ? "WHOOP authorization expired. Reconnect your account."
        : "WHOOP could not authorize the connection. Try again later.",
      r.status === 400 || r.status === 401 ? 401 : 503,
    );
  const t: any = await r.json();
  if (
    typeof t.access_token !== "string" ||
    typeof t.refresh_token !== "string" ||
    typeof t.expires_in !== "number" ||
    t.expires_in <= 0
  )
    throw new WhoopError(
      "WHOOP returned an incomplete authorization. Reconnect and allow the requested access.",
    );
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
  };
}
async function saveTokens(owner: string, lease: string, tokens: Tokens) {
  const result = await database()
    .prepare(
      "UPDATE whoop_connections SET credentials=? WHERE owner=? AND lease=? AND lease_until>? RETURNING owner",
    )
    .bind(await seal(owner, tokens), owner, lease, Date.now())
    .first();
  if (!result) throw new WhoopError("Sync timed out. Please try again.", 409);
}
export async function exchangeCode(owner: string, code: string) {
  return withLease(owner, async (lease) => {
    const c = requiredConfig();
    const t = await tokenRequest(
      { grant_type: "authorization_code", code, redirect_uri: c.redirectUri },
      AbortSignal.timeout(20000),
    );
    await saveTokens(owner, lease, t);
    await database()
      .prepare(
        "UPDATE whoop_connections SET snapshot=NULL,updated=NULL WHERE owner=? AND lease=?",
      )
      .bind(owner, lease)
      .run();
  });
}
async function accessTokens(
  owner: string,
  lease: string,
  signal: AbortSignal,
  force = false,
) {
  const row = await connection(owner);
  if (!row?.credentials)
    throw new WhoopError("Connect your WHOOP account first.", 400);
  let tokens = await unseal(owner, row.credentials);
  if (force || tokens.expiresAt < Date.now() + 60000) {
    tokens = await tokenRequest(
      {
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        scope: "offline",
      },
      signal,
    );
    await saveTokens(owner, lease, tokens);
  }
  return tokens;
}
export async function fetchCollection(
  path: string,
  token: string,
  start: string,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<WhoopRecord[]> {
  const rows: WhoopRecord[] = [];
  let next: string | undefined;
  const seen = new Set<string>();
  do {
    const u = new URL(API + path);
    u.searchParams.set("limit", "25");
    u.searchParams.set("start", start);
    if (next) u.searchParams.set("nextToken", next);
    const r = await fetcher(u, {
      headers: { Authorization: "Bearer " + token },
      signal,
    });
    if (!r.ok)
      throw new WhoopError(
        r.status === 401
          ? "Reconnect WHOOP to continue syncing."
          : r.status === 429
            ? "WHOOP is limiting requests. Try again in a few minutes."
            : "WHOOP is unavailable. Your last successful sync is still saved.",
        r.status === 401 ? 401 : r.status === 429 ? 429 : 503,
      );
    const data: any = await r.json();
    if (!Array.isArray(data.records))
      throw new WhoopError(
        "WHOOP returned an incomplete response. Your saved data is unchanged.",
      );
    rows.push(...data.records);
    next = data.next_token || undefined;
    if (next && (seen.has(next) || seen.size >= 30))
      throw new WhoopError(
        "WHOOP history could not finish loading. Your saved data is unchanged.",
      );
    if (next) seen.add(next);
  } while (next);
  return rows;
}
export async function syncWhoop(owner: string) {
  return withLease(owner, async (lease) => {
    const previous = await connection(owner);
    if (previous?.updated && Date.now() - previous.updated < 60000) return;
    const signal = AbortSignal.timeout(60000);
    let tokens = await accessTokens(owner, lease, signal);
    const start = new Date(Date.now() - 30 * 86400000).toISOString();
    // Fetch sequentially so a 401 cannot race a rotating refresh token.
    const snapshot: WhoopSnapshot = {
      cycles: [],
      recoveries: [],
      sleeps: [],
      workouts: [],
    };
    let refreshed = false;
    for (const [key, path] of [
      ["cycles", "/cycle"],
      ["recoveries", "/recovery"],
      ["sleeps", "/activity/sleep"],
      ["workouts", "/activity/workout"],
    ] as const) {
      try {
        snapshot[key] = await fetchCollection(
          path,
          tokens.access_token,
          start,
          signal,
        );
      } catch (e) {
        if (!(e instanceof WhoopError) || e.status !== 401 || refreshed)
          throw e;
        tokens = await accessTokens(owner, lease, signal, true);
        refreshed = true;
        snapshot[key] = await fetchCollection(
          path,
          tokens.access_token,
          start,
          signal,
        );
      }
    }
    const result = await database()
      .prepare(
        "UPDATE whoop_connections SET snapshot=?,updated=? WHERE owner=? AND lease=? AND lease_until>? RETURNING owner",
      )
      .bind(JSON.stringify(snapshot), Date.now(), owner, lease, Date.now())
      .first();
    if (!result)
      throw new WhoopError(
        "Sync timed out. Your previous data is still saved.",
        409,
      );
  });
}
export async function disconnectWhoop(owner: string) {
  return withLease(owner, async (lease) => {
    const row = await connection(owner);
    if (row?.credentials) {
      const signal = AbortSignal.timeout(20000);
      let tokens: Tokens | null = null;
      try {
        tokens = await accessTokens(owner, lease, signal);
      } catch (e) {
        if (!(e instanceof WhoopError) || e.status !== 401) throw e;
      }
      if (tokens) {
        const r = await fetch(API + "/user/access", {
          method: "DELETE",
          headers: { Authorization: "Bearer " + tokens.access_token },
          signal,
        });
        if (!r.ok && r.status !== 401 && r.status !== 404)
          throw new WhoopError("WHOOP could not disconnect. Please try again.");
      }
    }
    await database().batch([
      database()
        .prepare("DELETE FROM whoop_connections WHERE owner=? AND lease=?")
        .bind(owner, lease),
      database().prepare("DELETE FROM whoop_states WHERE owner=?").bind(owner),
    ]);
  });
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function errorResponse(e: unknown) {
  return json(
    {
      error:
        e instanceof WhoopError
          ? e.message
          : "WHOOP could not complete this request. Please try again.",
    },
    e instanceof WhoopError ? e.status : 503,
  );
}
export function sameOrigin(req: Request) {
  return req.headers.get("origin") === new URL(req.url).origin;
}
