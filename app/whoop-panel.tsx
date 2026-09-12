"use client";
import { useEffect, useState } from "react";
import {
  HeartPulse,
  Moon,
  Activity,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cycleSignals, indiaDate, sleepHours } from "@/lib/whoop-data";
import type { WhoopController } from "./use-whoop";
const number = (value: unknown, decimals = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(decimals)
    : "—";
const dateLabel = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "No reading yet";
export function WhoopPanel({
  compact = false,
  onOpen,
  whoop,
}: {
  compact?: boolean;
  onOpen?: () => void;
  whoop: WhoopController;
}) {
  const { data, error, busy, connect, disconnect, refresh } = whoop;
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const code = new URLSearchParams(location.search).get("connection");
    const messages: Record<string, string> = {
      connected: "WHOOP connected. Your first sync is starting.",
      denied:
        "You cancelled WHOOP authorization. You can connect whenever you’re ready.",
      expired: "This connection link expired. Please connect again.",
      failed: "WHOOP could not connect. Check setup and try again.",
      signin: "Sign in to your OS, then reconnect WHOOP.",
      setup: "Complete WHOOP setup before connecting.",
    };
    if (code) {
      setNotice(messages[code] || "");
      window.history.replaceState({}, "", location.pathname);
    }
  }, []);
  const { cycle, recovery, sleep, recoveryScore, strain, hours } = cycleSignals(
    data?.snapshot || null,
  );
  const current =
    !!cycle?.start &&
    indiaDate(cycle.start) === indiaDate(new Date().toISOString());
  const stale = !!data?.updated && Date.now() - data.updated > 30 * 60000;
  const state = !data
    ? "Loading connection…"
    : !data.connected
      ? "Not connected"
      : busy
        ? "Syncing…"
        : stale
          ? "Saved data · sync overdue"
          : "Connected";
  const reading = cycle?.start
    ? `${current ? "Current cycle" : "Last available cycle"} · ${dateLabel(cycle.start)}`
    : data?.connected
      ? "Waiting for your first cycle"
      : "Your data appears after connection";
  const metrics = [
    [
      HeartPulse,
      "Recovery",
      number(recoveryScore),
      "%",
      recovery?.score_state === "PENDING_SCORE"
        ? "WHOOP is calculating"
        : "WHOOP recovery score",
    ],
    [
      Moon,
      "Sleep",
      number(hours, 1),
      "hours",
      sleep?.nap ? "Nap" : "Time asleep · excludes awake time",
    ],
    [
      Activity,
      "Day strain",
      number(strain, 1),
      "/ 21",
      "WHOOP physiological cycle",
    ],
  ] as const;
  return (
    <>
      {!compact && (
        <div className="page-heading">
          <div>
            <p className="eyebrow">NIVETHA / BODY + LIFE</p>
            <h1>
              Your body, <em>in context.</em>
            </h1>
            <p>Sleep, recovery and movement deserve space here too.</p>
          </div>
        </div>
      )}
      <section className="body-signal">
        <div className="signal-heading">
          <div>
            <p className="eyebrow">BODY SIGNAL / WHOOP</p>
            <h2>
              {data?.connected
                ? "This is where you’re at."
                : "A day that starts with you."}
            </h2>
            <p>{reading}</p>
          </div>
          <div className="signal-controls">
            <span className="connection-state">{state}</span>
            {compact ? (
              <button className="button secondary" onClick={onOpen}>
                {data?.connected ? "See my body data" : "Set up WHOOP"}
                <ArrowUpRight size={16} />
              </button>
            ) : data?.connected ? (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => refresh(true)}
              >
                <RefreshCw size={16} /> {busy ? "Syncing…" : "Sync now"}
              </button>
            ) : data?.configured ? (
              <button
                className="button secondary"
                disabled={busy}
                onClick={connect}
              >
                Connect WHOOP <ArrowUpRight size={16} />
              </button>
            ) : (
              <a className="button secondary" href="#whoop-setup">
                Set up connection <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
        <div className="signal-metrics">
          {metrics.map(([Icon, label, value, unit, note]) => (
            <div className="signal-metric" key={label}>
              <span>
                <Icon size={18} />
                {label}
              </span>
              <strong>
                {value}
                <small> {unit}</small>
              </strong>
              <p>{data?.connected ? note : "Connect WHOOP to see your data"}</p>
            </div>
          ))}
        </div>
        <div className="signal-foot">
          <span>
            {data?.updated
              ? `Last synced ${new Date(data.updated).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} IST`
              : "No sample scores. Just your actual data."}
          </span>
          <span>30-day history · auto-sync while your OS is open</span>
        </div>
      </section>
      {(error || notice) && (
        <div className="whoop-notice" role="status">
          <p>{error || notice}</p>
          {error && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => refresh()}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {!compact && (
        <>
          {!data?.connected && (
            <section className="panel whoop-setup" id="whoop-setup">
              <p className="eyebrow">ONE-TIME SETUP</p>
              <h2>Bring your WHOOP into your world.</h2>
              <p>
                You’ll authorize read-only access to recovery, sleep, cycles and
                workouts.
              </p>
              <ol>
                <li>
                  <strong>Create your WHOOP app.</strong> Open the{" "}
                  <a
                    href="https://developer-dashboard.whoop.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WHOOP Developer Dashboard ↗
                  </a>{" "}
                  and create an application named Nivetha OS.
                </li>
                <li>
                  <strong>Add this redirect URL.</strong>
                  <code>
                    {data?.redirectUri ||
                      "https://nivetha-os-command.niv2001.chatgpt.site/api/whoop/callback"}
                  </code>
                </li>
                <li>
                  <strong>Configure the server.</strong> Follow the{" "}
                  <a
                    href="https://github.com/Nivetha200111/MyOS/blob/main/docs/WHOOP_SETUP.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    setup guide ↗
                  </a>{" "}
                  to save your app credentials securely. Don’t put secrets in
                  GitHub or chat.
                </li>
                <li>
                  <strong>Connect your account.</strong> Return here, refresh
                  setup status, then authorize WHOOP.
                </li>
              </ol>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => refresh()}
              >
                Refresh setup status
              </button>
            </section>
          )}
          <div className="body-details">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>The quieter signals</h2>
                  <p>{reading}</p>
                </div>
              </div>
              <dl className="body-measures">
                {[
                  [
                    "Heart rate variability",
                    recovery?.score_state === "SCORED"
                      ? recovery.score?.hrv_rmssd_milli
                      : null,
                    "ms",
                  ],
                  [
                    "Resting heart rate",
                    recovery?.score_state === "SCORED"
                      ? recovery.score?.resting_heart_rate
                      : null,
                    "bpm",
                  ],
                  [
                    "Sleep performance",
                    sleep?.score_state === "SCORED"
                      ? sleep.score?.sleep_performance_percentage
                      : null,
                    "%",
                  ],
                  [
                    "Sleep consistency",
                    sleep?.score_state === "SCORED"
                      ? sleep.score?.sleep_consistency_percentage
                      : null,
                    "%",
                  ],
                ].map(([label, value, unit]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {number(value)} <small>{unit}</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <h2>Movement, lately</h2>
                  <p>Your last five WHOOP workouts.</p>
                </div>
              </div>
              {data?.snapshot?.workouts.length ? (
                data.snapshot.workouts
                  .slice()
                  .sort((a, b) => (b.start || "").localeCompare(a.start || ""))
                  .slice(0, 5)
                  .map((w) => (
                    <div className="body-history-row" key={w.id}>
                      <div>
                        <strong>{w.sport_name || "Workout"}</strong>
                        <small>
                          {dateLabel(w.start)} ·{" "}
                          {w.start && w.end
                            ? Math.round(
                                (Date.parse(w.end) - Date.parse(w.start)) /
                                  60000,
                              ) + " min"
                            : "Duration unavailable"}
                        </small>
                      </div>
                      <span>
                        {number(
                          w.score_state === "SCORED" ? w.score?.strain : null,
                          1,
                        )}{" "}
                        strain
                      </span>
                    </div>
                  ))
              ) : (
                <p className="body-empty">
                  {data?.connected
                    ? "No workouts in the last 30 days."
                    : "Your walks, training and other activities will land here after you connect."}
                </p>
              )}
            </section>
          </div>
          <section className="panel body-history">
            <div className="section-heading">
              <div>
                <h2>Your rhythm over time</h2>
                <p>
                  Up to 30 days, grouped by WHOOP cycle. Dates shown in IST.
                </p>
              </div>
            </div>
            {data?.snapshot?.cycles.length ? (
              <div className="body-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Recovery</th>
                      <th>Sleep</th>
                      <th>Strain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.snapshot.cycles
                      .slice()
                      .sort((a, b) =>
                        (b.start || "").localeCompare(a.start || ""),
                      )
                      .map((c) => {
                        const r = data.snapshot!.recoveries.find(
                          (r) => r.cycle_id === c.id,
                        );
                        const s =
                          data.snapshot!.sleeps.find(
                            (s) => s.id === r?.sleep_id,
                          ) ||
                          data.snapshot!.sleeps.find(
                            (s) => !s.nap && s.cycle_id === c.id,
                          );
                        const score =
                          r?.score_state === "SCORED"
                            ? r.score?.recovery_score
                            : null;
                        return (
                          <tr key={c.id}>
                            <td>{dateLabel(c.start)}</td>
                            <td>
                              <span className="recovery-reading">
                                {number(score)}
                                {score != null ? "%" : ""}
                              </span>
                            </td>
                            <td>{number(sleepHours(s), 1)} h</td>
                            <td>
                              {number(
                                c.score_state === "SCORED"
                                  ? c.score?.strain
                                  : null,
                                1,
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="body-empty">
                Your history will appear after your first sync. Unscored or
                missing readings stay blank.
              </div>
            )}
          </section>
          {data?.connected && (
            <div className="whoop-management">
              <p>
                Syncs on opening and every 15 minutes while visible. Sync now
                checks for updates; requests within one minute reuse the last
                sync.
              </p>
              <button className="text-button" disabled={busy} onClick={connect}>
                Reconnect WHOOP
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Disconnect & remove WHOOP data
              </button>
            </div>
          )}
        </>
      )}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Disconnect WHOOP?</AlertDialogTitle>
          <AlertDialogDescription>
            This revokes the connection and removes synced WHOOP data from your
            OS. Your manual body check-ins stay saved.
          </AlertDialogDescription>
          <div className="form-actions">
            <AlertDialogCancel disabled={busy}>
              Keep connected
            </AlertDialogCancel>
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                await disconnect();
                setConfirm(false);
              }}
            >
              Disconnect & remove
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
