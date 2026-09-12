// Deterministic integration tests: in-memory SQLite, synthetic tokens, mocked WHOOP.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const temp = await mkdtemp(join(tmpdir(), "nivetha-whoop-test-"));
const runtime = `import {DatabaseSync} from 'node:sqlite';
export const sql=new DatabaseSync(':memory:');
export const env={WHOOP_CLIENT_ID:'test-client',WHOOP_CLIENT_SECRET:'synthetic-secret',WHOOP_TOKEN_KEY:'ab'.repeat(32),WHOOP_REDIRECT_URI:'https://os.test/api/whoop/callback'};
export const auth={user:{userId:'owner-a'}};
export const db={prepare(q){return {bind(...args){return {async first(){return sql.prepare(q).get(...args) || null},async run(){return sql.prepare(q).run(...args)},async all(){return {results:sql.prepare(q).all(...args)}}}}}},async batch(items){return Promise.all(items.map(item=>item.run()))}};`;
try {
  await build({
    stdin: {
      contents: `export * from './lib/whoop-server'; export * from './lib/whoop-data'; export {sql,env,auth} from 'test-runtime'; export * as connectRoute from './app/api/whoop/connect/route'; export * as callbackRoute from './app/api/whoop/callback/route'; export * as apiRoute from './app/api/whoop/route';`,
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: join(temp, "bundle.mjs"),
    plugins: [
      {
        name: "test-bindings",
        setup(b) {
          b.onResolve(
            {
              filter:
                /^(test-runtime|cloudflare:workers|@\/db|@\/app\/chatgpt-auth)$/,
            },
            (a) => ({ path: a.path, namespace: "test" }),
          );
          b.onLoad({ filter: /.*/, namespace: "test" }, (a) => ({
            contents:
              a.path === "test-runtime"
                ? runtime
                : a.path === "cloudflare:workers"
                  ? `export {env} from 'test-runtime';`
                  : a.path === "@/db"
                    ? `export {db as databaseBinding} from 'test-runtime';import {db} from 'test-runtime';export function database(){return db}`
                    : `import {auth} from 'test-runtime';export async function getChatGPTUser(){return auth.user;}`,
            loader: "js",
          }));
        },
      },
    ],
  });
  const m = await import(pathToFileURL(join(temp, "bundle.mjs")));
  m.sql.exec(await readFile("drizzle/0001_polite_northstar.sql", "utf8"));
  const req = (path, method = "POST", origin = "https://os.test") =>
    new Request("https://os.test/api/whoop" + path, {
      method,
      headers: { Origin: origin },
    });
  let fetches = [];
  let failWorkouts = false;
  let refreshCount = 0;
  let sequence = 0;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    fetches.push({
      url: u.href,
      method: init.method || "GET",
      authorization: init.headers?.Authorization,
    });
    if (u.pathname.endsWith("/token")) {
      const body = new URLSearchParams(init.body);
      if (body.get("grant_type") === "refresh_token") {
        refreshCount++;
        assert.equal(body.get("scope"), "offline");
      }
      sequence++;
      return Response.json({
        access_token: "synthetic-access-" + sequence,
        refresh_token: "synthetic-refresh-" + sequence,
        expires_in: 3600,
      });
    }
    if (u.pathname.endsWith("/user/access"))
      return new Response(null, { status: 204 });
    if (failWorkouts && u.pathname.endsWith("/workout"))
      return new Response(null, { status: 429 });
    if (u.pathname.endsWith("/cycle"))
      return Response.json(
        u.searchParams.get("nextToken")
          ? {
              records: [
                {
                  id: 1,
                  start: "2026-09-10T22:00:00Z",
                  score_state: "SCORED",
                  score: { strain: 8 },
                },
              ],
            }
          : {
              records: [
                {
                  id: 2,
                  start: "2026-09-11T22:00:00Z",
                  score_state: "SCORED",
                  score: { strain: 10 },
                },
              ],
              next_token: "page2",
            },
      );
    return Response.json({ records: [] });
  };
  assert.equal(
    (await m.connectRoute.POST(req("/connect", "POST", "https://evil.test")))
      .status,
    403,
  );
  m.auth.user = null;
  assert.equal((await m.apiRoute.GET()).status, 401);
  assert.equal((await m.connectRoute.POST(req("/connect"))).status, 401);
  m.auth.user = { userId: "owner-a" };
  const connected = await m.connectRoute.POST(req("/connect"));
  assert.equal(connected.status, 200);
  const location = new URL((await connected.json()).url);
  assert.equal(location.searchParams.get("scope"), m.scopes);
  const cookie = connected.headers.get("set-cookie").split(";")[0];
  const state = location.searchParams.get("state");
  const callback = (s = state, c = cookie) =>
    new Request(
      "https://os.test/api/whoop/callback?code=test-code&state=" + s,
      { headers: { Cookie: c } },
    );
  assert.equal(
    (await m.callbackRoute.GET(callback("wrong"))).headers.get("location"),
    "/whoop?connection=expired",
  );
  m.auth.user = { userId: "owner-b" };
  assert.equal(
    (await m.callbackRoute.GET(callback())).headers.get("location"),
    "/whoop?connection=expired",
  );
  m.auth.user = { userId: "owner-a" };
  assert.equal(
    (await m.callbackRoute.GET(callback())).headers.get("location"),
    "/whoop?connection=connected",
  );
  assert.equal(
    (await m.callbackRoute.GET(callback())).headers.get("location"),
    "/whoop?connection=expired",
  );
  const raw = m.sql
    .prepare("SELECT credentials FROM whoop_connections WHERE owner=?")
    .get("owner-a").credentials;
  assert.ok(!raw.includes("synthetic-access"));
  assert.ok(!raw.includes("synthetic-refresh"));
  await m.syncWhoop("owner-a");
  const saved = await m.connection("owner-a");
  assert.equal(JSON.parse(saved.snapshot).cycles.length, 2);
  assert.equal(
    (await m.apiRoute.GET()).headers.get("cache-control"),
    "no-store",
  );
  assert.ok(!(await (await m.apiRoute.GET()).text()).includes("credentials"));
  m.auth.user = { userId: "owner-b" };
  assert.equal((await (await m.apiRoute.GET()).json()).snapshot, null);
  m.auth.user = { userId: "owner-a" };
  const count = fetches.length;
  await m.syncWhoop("owner-a");
  assert.equal(fetches.length, count, "one minute throttle");
  m.sql
    .prepare("UPDATE whoop_connections SET updated=0 WHERE owner=?")
    .run("owner-a");
  failWorkouts = true;
  await assert.rejects(
    () => m.syncWhoop("owner-a"),
    (e) => e.status === 429,
  );
  assert.equal(
    (await m.connection("owner-a")).snapshot,
    saved.snapshot,
    "partial failure preserves snapshot",
  );
  failWorkouts = false;
  await m.withLease("owner-a", async () => {
    await assert.rejects(
      () => m.syncWhoop("owner-a"),
      (e) => e.status === 409,
    );
  });
  // Advance only the server clock to exercise rotating refresh credentials.
  const realNow = Date.now;
  Date.now = () => realNow() + 7200000;
  await m.syncWhoop("owner-a");
  Date.now = realNow;
  assert.equal(refreshCount, 1);
  await m.exchangeCode("owner-a", "another-account");
  assert.equal(
    (await m.connection("owner-a")).snapshot,
    null,
    "reconnect clears old account readings",
  );
  await m.disconnectWhoop("owner-a");
  assert.equal(await m.connection("owner-a"), null);
  assert.ok(
    fetches.some(
      (f) => f.method === "DELETE" && f.url.endsWith("/user/access"),
    ),
  );
  const stage = {
    total_light_sleep_time_milli: 4 * 3600000,
    total_slow_wave_sleep_time_milli: 3600000,
    total_rem_sleep_time_milli: 2 * 3600000,
    total_awake_time_milli: 3600000,
  };
  assert.equal(
    m.sleepHours({ score_state: "SCORED", score: { stage_summary: stage } }),
    7,
  );
  assert.equal(
    m.sleepHours({
      score_state: "PENDING_SCORE",
      score: { stage_summary: stage },
    }),
    null,
  );
  assert.equal(m.indiaDate("2026-09-11T22:00:00Z"), "2026-09-12");
  const signal = m.cycleSignals({
    cycles: [{ id: 1, start: "2026-09-11T22:00:00Z" }],
    recoveries: [
      { cycle_id: 2, score_state: "SCORED", score: { recovery_score: 90 } },
    ],
    sleeps: [],
    workouts: [],
  });
  assert.equal(
    signal.recoveryScore,
    null,
    "never mix readings from different cycles",
  );
  console.log(
    "PASS: auth, CSRF, single-use owner/browser-bound OAuth state, token encryption, owner isolation, pagination, throttle, partial failure retention, sync lease, token rotation, reconnect, revoke/delete, sleep stages and cycle dates.",
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
