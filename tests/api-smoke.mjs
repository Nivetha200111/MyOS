import assert from "node:assert/strict";
const origin = "http://localhost:5173";
const login = await fetch(origin + "/signin-with-chatgpt?return_to=/", {
  redirect: "manual",
});
const cookie = login.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "local preview sign-in");
const headers = {
  "Content-Type": "application/json",
  Cookie: cookie,
  Origin: origin,
};
async function call(method, body) {
  const r = await fetch(origin + "/api/records", {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
const initial = await call("GET");
assert.equal(initial.status, 200);
assert.equal(
  initial.data.records.filter(
    (r) => r.kind === "goal" && r.data.status === "Active",
  ).length,
  4,
);
const created = [];
async function add(kind, data, id = crypto.randomUUID()) {
  const res = await call("POST", { id, kind, data, version: 0 });
  if (res.status === 200) created.push(res.data.record);
  return res;
}
try {
  assert.equal(
    (
      await add("goal", {
        title: "QA fifth goal",
        lane: "Work",
        description: "",
        metric: "",
        status: "Active",
      })
    ).status,
    409,
    "four-goal cap",
  );
  const task = {
    title: "QA capacity test",
    lane: "Build",
    project: "Personal",
    date: "2099-01-01",
    minutes: 25,
    priority: true,
    done: false,
  };
  const concurrent = await Promise.all(
    [1, 2, 3, 4].map(() => add("task", task)),
  );
  assert.equal(concurrent.filter((r) => r.status === 200).length, 3);
  assert.equal(
    concurrent.filter((r) => r.status === 409).length,
    1,
    "atomic daily priority cap",
  );
  const saved = concurrent.find((r) => r.status === 200).data.record;
  assert.equal(
    (await call("POST", { ...saved, data: { ...task, done: true } })).status,
    200,
  );
  saved.version++;
  saved.data.done = true;
  assert.equal(
    (await call("POST", { ...saved, version: 1, data: task })).status,
    409,
    "stale edit rejected",
  );
  const cert = {
    title: "QA cert",
    status: "Active",
    syllabus: "",
    progress: 0,
    score: 0,
    exam: "",
  };
  assert.equal((await add("cert", cert)).status, 200);
  assert.equal((await add("cert", cert)).status, 409, "one certification cap");
  assert.equal(
    (await add("task", { ...task, date: "2026-02-31" })).status,
    400,
    "invalid date rejected",
  );
  assert.equal(
    (
      await add("health", {
        date: "2099-01-01",
        sleep: 99,
        energy: "Low",
        activity: "Rest / recovery",
        minutes: 0,
        distance: 0,
        strength: "",
        notes: "",
      })
    ).status,
    400,
    "invalid sleep rejected",
  );
  const focus = await add("focus", {
    title: "QA timer",
    started: 0,
    end: 1,
    minutes: 5,
    status: "Complete",
  });
  assert.equal(focus.status, 200);
  assert.equal(focus.data.record.data.status, "Running", "server owns timer");
  assert.equal(
    (
      await call("POST", {
        ...focus.data.record,
        data: { ...focus.data.record.data, status: "Complete" },
      })
    ).status,
    400,
    "early focus completion rejected",
  );
  const next = await call("GET");
  assert.ok(
    next.data.records.some((r) => r.id === saved.id && r.data.done),
    "saved task read back",
  );
  const cross = await fetch(origin + "/api/records", {
    method: "POST",
    headers: { ...headers, Origin: "https://unrelated.invalid" },
    body: JSON.stringify({
      id: "qa-origin",
      kind: "task",
      data: task,
      version: 0,
    }),
  });
  assert.equal(cross.status, 403, "cross-origin rejected");
  console.log(
    "PASS: persisted read-back, four-goal cap, concurrent three-priority cap, one-certification cap, stale edit conflict, date/health validation, server-owned focus time, cross-origin protection.",
  );
} finally {
  for (const r of created) {
    const fresh = (await call("GET")).data.records.find((x) => x.id === r.id);
    if (fresh)
      assert.equal(
        (await call("DELETE", { id: fresh.id, version: fresh.version })).status,
        200,
      );
  }
  // Remove only our named browser QA entry from the local preview database.
  for (const r of (await call("GET")).data.records.filter(
    (r) => r.data.title === "QA · verify a daily priority",
  ))
    await call("DELETE", { id: r.id, version: r.version });
}
