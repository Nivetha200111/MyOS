"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { WhoopStatus } from "@/lib/whoop-data";
export function useWhoop() {
  const [data, setData] = useState<WhoopStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const request = useCallback(async (method = "GET") => {
    const r = await fetch("/api/whoop", { method, cache: "no-store" });
    const result = (await r.json()) as WhoopStatus;
    if (!r.ok) throw Error(result.error || "WHOOP is unavailable.");
    setData(result);
    return result;
  }, []);
  const refresh = useCallback(
    async (manual = false) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        let result = await request();
        if (
          result.configured &&
          result.connected &&
          (manual ||
            !result.updated ||
            Date.now() - result.updated > 15 * 60000)
        )
          result = await request("POST");
        setError("");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [request],
  );
  useEffect(() => {
    void refresh();
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(tick, 60000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);
  const connect = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/whoop/connect", { method: "POST" });
      const result = (await r.json()) as { error?: string; url: string };
      if (!r.ok) throw Error(result.error);
      window.location.assign(result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await request("DELETE");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { data, error, busy, refresh, connect, disconnect };
}
export type WhoopController = ReturnType<typeof useWhoop>;
