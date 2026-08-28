import * as fx from "./fixtures";
import type {
  Billing, CareTeamMember, DocumentItem, HomeSummary, Insurance, Medication,
  CheckinAnswer, CheckinQuestion, CheckinResult, MessageRecipient, TherapyPlan,
  Thread, Visit,
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
    careTeam: fx.careTeam,
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

/* ---------- care team ---------- */

export async function getCareTeam(): Promise<CareTeamMember[]> {
  return wait(fx.careTeam);
}

/* ---------- therapy ----------
   Returns an empty plan rather than null when the patient has no therapist,
   so screens branch on `therapist` and never on a thrown error. */

export async function getTherapyPlan(): Promise<TherapyPlan> {
  const therapist = fx.careTeam.find((m) => m.track === "therapy") ?? null;
  if (!therapist) return wait({ therapist: null, goals: [], practice: [], reviewedAt: null });
  const lastTherapy = fx.visits
    .filter((v) => v.track === "therapy" && v.status === "completed")
    .sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
  return wait({
    therapist: { name: therapist.name, credential: therapist.credential, track: therapist.track },
    goals: fx.goals,
    practice: fx.practice,
    reviewedAt: lastTherapy ? lastTherapy.startAt.slice(0, 10) : null,
  });
}

export async function setPracticeDone(id: string, done: boolean): Promise<void> {
  const item = fx.practice.find((p) => p.id === id);
  if (item) item.done = done;
  await wait(null, 260);
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

/** Who a message can go to. The office is always last and always available —
    a patient who cannot decide should still be able to send. */
export async function getRecipients(): Promise<MessageRecipient[]> {
  const team: MessageRecipient[] = fx.careTeam.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    track: m.track,
    good_for:
      m.track === "psychiatry"
        ? "Medication questions, side effects, refills"
        : "Anything about your sessions or what you're working on",
  }));
  return wait([
    ...team,
    { id: "office", name: "The office", role: "Front desk", track: null,
      good_for: "Scheduling, billing, insurance, records" },
  ]);
}

const stamp = () => new Date().toISOString().slice(0, 19);
let seq = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

/* The sandbox answers you. A demo where nothing ever comes back teaches the
   wrong thing about what this feature is, and the reply is what proves the
   one-business-day promise is a promise and not a wall. */
function scheduleReply(threadId: string, recipientName: string) {
  setTimeout(() => {
    const t = fx.threads.find((x) => x.id === threadId);
    if (!t) return;
    t.messages.push({
      id: nextId("msg"),
      from: "care_team",
      authorName: recipientName,
      body:
        "Thanks for writing — I've read this. Nothing here worries me, and I'd rather " +
        "go through it properly with you than in a message, so let's pick it up at your " +
        "next visit. If anything changes before then, or it starts feeling urgent, call " +
        "the office at (615) 555-0100.",
      sentAt: stamp(),
    });
    t.updatedAt = stamp();
    t.unread = true;
    t.awaitingReply = false;
  }, 7000);
}

export async function createThread(input: {
  recipientId: string; subject: string; body: string;
}): Promise<Thread> {
  const all = await getRecipients();
  const to = all.find((r) => r.id === input.recipientId) ?? all[all.length - 1];
  const thread: Thread = {
    id: nextId("t"),
    subject: input.subject.trim() || "New message",
    updatedAt: stamp(),
    unread: false,
    withProviderId: to.id === "office" ? null : to.id,
    withName: to.name,
    track: to.track,
    awaitingReply: true,
    messages: [{
      id: nextId("msg"),
      from: "patient",
      authorName: fx.patient.preferredName ?? fx.patient.firstName,
      body: input.body.trim(),
      sentAt: stamp(),
    }],
  };
  fx.threads.push(thread);
  await wait(null, 520);
  scheduleReply(thread.id, to.name);
  return structuredClone(thread);
}

export async function sendReply(threadId: string, body: string): Promise<Thread | null> {
  const t = fx.threads.find((x) => x.id === threadId);
  if (!t) return null;
  t.messages.push({
    id: nextId("msg"),
    from: "patient",
    authorName: fx.patient.preferredName ?? fx.patient.firstName,
    body: body.trim(),
    sentAt: stamp(),
  });
  t.updatedAt = stamp();
  t.awaitingReply = true;
  await wait(null, 420);
  scheduleReply(t.id, t.withName);
  return structuredClone(t);
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

/* ---------- check-in ---------- */

export async function getCheckinQuestions(): Promise<CheckinQuestion[]> {
  return wait(fx.checkinQuestions);
}

export async function getLastCheckin(): Promise<CheckinResult | null> {
  return wait(fx.checkins[fx.checkins.length - 1] ?? null);
}

/** Scores, records, and clears the form from the to-do list. `flagged` is the
    only field that changes anyone's behaviour, so it is computed here rather
    than left to a screen to work out. */
export async function submitCheckin(answers: CheckinAnswer[]): Promise<CheckinResult> {
  const by = new Map(answers.map((a) => [a.id, a.value]));
  const sum = (scale: string) =>
    fx.checkinQuestions.filter((q) => q.scale === scale)
      .reduce((t, q) => t + (by.get(q.id) ?? 0), 0);
  const safety = fx.checkinQuestions.find((q) => q.safety);
  const result: CheckinResult = {
    submittedAt: new Date().toISOString().slice(0, 19),
    phq9: sum("phq9"),
    gad7: sum("gad7"),
    flagged: !!safety && (by.get(safety.id) ?? 0) > 0,
  };
  fx.checkins.push(result);
  const i = fx.formsDue.findIndex((f) => f.id === "f-1");
  if (i >= 0) fx.formsDue.splice(i, 1);
  await wait(null, 620);
  return result;
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
