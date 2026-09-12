"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { type RecordItem, type Kind } from "@/lib/model";
export function useWorkspace() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [status, setStatus] = useState("Loading workspace…");
  const [ready, setReady] = useState(false);
  const saving = useRef(0);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    const current = generation.current;
    try {
      const response = await fetch("/api/records", { cache: "no-store" });
      const data: any = await response.json();
      if (!response.ok) throw Error(data.error);
      if (current !== generation.current || saving.current) return;
      setRecords(data.records);
      setReady(true);
      setStatus("Synced across devices");
    } catch (e) {
      setStatus((e as Error).message || "Connection unavailable");
    }
  }, []);
  useEffect(() => {
    reload();
    const interval = setInterval(reload, 20000);
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [reload]);
  const save = async (kind: Kind, data: any, record?: RecordItem) => {
    if (!ready) {
      toast.error("Wait for your workspace to load before saving.");
      return false;
    }
    if (saving.current) {
      toast.info("Finishing the previous save. Please try again.");
      return false;
    }
    saving.current++;
    generation.current++;
    setBusy(true);
    setStatus("Saving…");
    try {
      const r = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          id: record?.id || crypto.randomUUID(),
          version: record?.version ?? 0,
          data,
        }),
      });
      const result: any = await r.json();
      if (!r.ok) throw Error(result.error);
      setRecords((prev) => [
        result.record,
        ...prev.filter((p) => p.id !== result.record.id),
      ]);
      setStatus("Synced across devices");
      return true;
    } catch (e) {
      setStatus("Save failed · draft preserved");
      toast.error((e as Error).message);
      return false;
    } finally {
      saving.current--;
      setBusy(false);
    }
  };
  const remove = async (record: RecordItem) => {
    if (saving.current) return false;
    saving.current++;
    generation.current++;
    setBusy(true);
    try {
      const r = await fetch("/api/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, version: record.version }),
      });
      const result: any = await r.json();
      if (!r.ok) throw Error(result.error);
      setRecords((p) => p.filter((r) => r.id !== record.id));
      setStatus("Synced across devices");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      saving.current--;
      setBusy(false);
    }
  };
  return { records, status, ready, busy, reload, save, remove };
}
