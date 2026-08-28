import * as fx from "./fixtures";
import type {
  Billing, DocumentItem, HomeSummary, Insurance, Medication, Thread, Visit,
} from "./types";

/* ============================================================
   THE DATA-ACCESS LAYER — the only module that knows where data comes from.

   Screens import from here and nowhere else. In the sandbox every function
   returns fixtures after a short delay so loading states are real. When the
   chart moves off Tebra, this file is rewritten to call the backend and NOT
   ONE SCREEN CHANGES.

   The rule that keeps that promise: no component may import `fixtures.ts`.
   ============================================================ */

export const SANDBOX = true;

/** Simulated latency — enough that skeletons and disabled states get exercised. */
const wait = <T,>(value: T, ms = 260): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

const now = () => Date.now();
const upcoming = (v: Visit) => Date.parse(v.startAt) > now() && v.status !== "cancelled";

/* ---------- home ---------- */

export async function getHomeSummary(): Promise<HomeSummary> {
  const next = fx.visits.filter(upcoming).sort((a, b) => a.startAt.localeCompare(b.startAt))[0] ?? null;
  const past = fx.visits
    .filter((v) => v.status === "completed")
    .sort((a, b) => b.startAt.localeCompare(a.startAt))[0] ?? null;
  return wait({
    patient: fx.patient,
    nextVisit: next,
    formsDue: fx.formsDue,
    balanceCents: fx.billing.balanceCents,
    unreadMessages: fx.threads.filter((t) => t.unread).length,
    lastVisit: past,
  });
}

/* ---------- visits ---------- */

export async function getUpcomingVisits(): Promise<Visit[]> {
  return wait(fx.visits.filter(upcoming).sort((a, b) => a.startAt.localeCompare(b.startAt)));
}

export async function getPastVisits(): Promise<Visit[]> {
  return wait(
    fx.visits.filter((v) => v.status === "completed").sort((a, b) => b.startAt.localeCompare(a.startAt)),
  );
}

export async function getVisit(id: string): Promise<Visit | null> {
  return wait(fx.visits.find((v) => v.id === id) ?? null);
}

export async function confirmVisit(id: string): Promise<void> {
  const v = fx.visits.find((x) => x.id === id);
  if (v) v.status = "confirmed";
  await wait(null, 400);
}

/* ---------- messages ---------- */

export async function getThreads(): Promise<Thread[]> {
  return wait([...fx.threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function getThread(id: string): Promise<Thread | null> {
  const t = fx.threads.find((x) => x.id === id);
  if (t) t.unread = false;
  return wait(t ?? null);
}

/* ---------- health ---------- */

export async function getMedications(): Promise<Medication[]> {
  return wait(fx.medications);
}

export async function requestRefill(id: string): Promise<void> {
  const m = fx.medications.find((x) => x.id === id);
  if (m && !m.controlled) {
    m.refill = { status: "requested", requestedAt: new Date().toISOString().slice(0, 10) };
  }
  await wait(null, 500);
}

/* ---------- billing ---------- */

export async function getBilling(): Promise<Billing> {
  return wait(fx.billing);
}

export async function getInsurance(): Promise<Insurance> {
  return wait(fx.insurance);
}

/* ---------- documents ---------- */

export async function getDocuments(): Promise<DocumentItem[]> {
  return wait([...fx.documents].sort((a, b) => b.date.localeCompare(a.date)));
}
