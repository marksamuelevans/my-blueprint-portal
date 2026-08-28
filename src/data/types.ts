/* Domain types for My Blueprint (the patient portal).

   These describe what a SCREEN needs, not what a database stores. When the
   sandbox is swapped for real data (api.ts), these shapes stay put and only
   the fetching changes — that is the whole point of the split. */

export type ISODate = string;      // "2026-09-03"
export type ISODateTime = string;  // "2026-09-03T10:00:00"

export interface Patient {
  firstName: string;
  lastName: string;
  preferredName: string | null;
  dob: ISODate;
  email: string;
  mobile: string;
  /** Drives the adolescent/proxy rules — see the design doc, §02. */
  accountType: "adult" | "minor_self" | "minor_proxy";
}

/* ============================================================
   TRACKS

   Blueprint runs psychiatry and therapy out of one practice, and plenty of
   patients see both. The track is therefore a property of a PROVIDER, a
   VISIT and a TASK — never of the navigation. There is no "therapy mode".
   A patient wondering whether they can move Thursday does not first decide
   which department the question belongs to, and making them choose would
   also imply the two clinicians don't talk to each other, which is the
   opposite of what an integrated practice is for.

   Sections appear when the relationship exists and stay absent when it
   doesn't, so a therapy-only patient never sees a Medications heading and
   a psychiatry-only patient never sees a treatment plan.
   ============================================================ */
export type Track = "psychiatry" | "therapy";

export interface Provider {
  name: string;
  credential: string;
  track: Track;
}

export interface CareTeamMember extends Provider {
  id: string;
  /** Plain-language role — "Prescriber", "Therapist". Never a billing title. */
  role: string;
  /** Roughly how often you meet, in the patient's words. */
  cadence: string;
  since: ISODate;
}

/** Therapy's equivalent of a medication list: what you're working on. */
export interface TherapyGoal {
  id: string;
  title: string;
  /** The patient's own words where we have them, not the clinical objective. */
  detail: string;
  addedAt: ISODate;
}

/** What was agreed to try between sessions. Never called "homework". */
export interface PracticeItem {
  id: string;
  title: string;
  detail: string;
  fromVisitId: string;
  done: boolean;
}

export interface TherapyPlan {
  therapist: Provider | null;
  goals: TherapyGoal[];
  practice: PracticeItem[];
  /** Set when the plan was last revisited together. */
  reviewedAt: ISODate | null;
}

export type VisitStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export interface Visit {
  id: string;
  startAt: ISODateTime;
  endAt: ISODateTime;
  provider: Provider;
  kind: string;                 // "Follow-up", "New patient evaluation"
  /** Mirrors provider.track — denormalised because screens filter on it. */
  track: Track;
  telehealth: boolean;
  status: VisitStatus;
  /** Purpose-written, plain-language patient artifact — never the raw note. */
  afterVisitSummary: string | null;
}

export interface Medication {
  id: string;
  name: string;
  strength: string;
  sig: string;
  prescriber: string;
  controlled: boolean;
  /** Set while a refill request is in flight. */
  refill: { status: "requested" | "in_progress" | "sent"; requestedAt: ISODate } | null;
}

export interface MessageItem {
  id: string;
  from: "patient" | "care_team";
  authorName: string;
  body: string;
  sentAt: ISODateTime;
}

export interface Thread {
  id: string;
  subject: string;
  updatedAt: ISODateTime;
  unread: boolean;
  /** Who it went to. Null means the front desk rather than a clinician. */
  withProviderId: string | null;
  withName: string;
  track: Track | null;
  /** True while a reply is expected — drives the "typing" affordance. */
  awaitingReply: boolean;
  messages: MessageItem[];
}

/** Who a new message can go to. Derived from the care team plus the office,
    so a patient never has to guess which inbox their question belongs in. */
export interface MessageRecipient {
  id: string;
  name: string;
  role: string;
  track: Track | null;
  /** What this person is the right choice for, in the patient's words. */
  good_for: string;
}

export interface Statement {
  id: string;
  date: ISODate;
  description: string;
  amountCents: number;
  paid: boolean;
}

export interface Billing {
  balanceCents: number;
  statements: Statement[];
  cardOnFile: { brand: string; last4: string } | null;
}

export interface Insurance {
  payer: string;
  memberId: string;
  status: "active" | "inactive" | "unknown";
  copayCents: number | null;
  checkedAt: ISODate | null;
}

export interface FormTask {
  id: string;
  title: string;
  minutes: number;
  dueBeforeVisitId: string | null;
}

/* ============================================================
   CHECK-IN (PHQ-9 / GAD-7)

   PHQ-9 and GAD-7 are free to reproduce without permission. What matters
   here is not the scoring, it is ITEM 9: "thoughts that you would be better
   off dead, or of hurting yourself in some way". Any answer above "Not at
   all" has to change what the screen does IMMEDIATELY — not on submit, not
   in a summary, not in a note a clinician reads on Monday.
   ============================================================ */
export type CheckinScale = "phq9" | "gad7";

export interface CheckinQuestion {
  id: string;
  scale: CheckinScale;
  text: string;
  /** True for PHQ-9 item 9 — the only question that changes the UI. */
  safety?: boolean;
}

export interface CheckinAnswer { id: string; value: 0 | 1 | 2 | 3 }

export interface CheckinResult {
  submittedAt: ISODateTime;
  phq9: number;
  gad7: number;
  /** Set when the safety item was endorsed. The office is told, and the
      patient is told the office was told. */
  flagged: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  date: ISODate;
  kind: "after_visit" | "consent" | "statement" | "other";
}

/** Everything the dashboard needs, in one call — it is the screen most
    patients ever see, so it should never fan out into six requests. */
export interface HomeSummary {
  patient: Patient;
  careTeam: CareTeamMember[];
  nextVisit: Visit | null;
  formsDue: FormTask[];
  balanceCents: number;
  unreadMessages: number;
  lastVisit: Visit | null;
}
