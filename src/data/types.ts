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

export interface Provider {
  name: string;
  credential: string;
}

export type VisitStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export interface Visit {
  id: string;
  startAt: ISODateTime;
  endAt: ISODateTime;
  provider: Provider;
  kind: string;                 // "Follow-up", "New patient evaluation"
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
  messages: MessageItem[];
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
  nextVisit: Visit | null;
  formsDue: FormTask[];
  balanceCents: number;
  unreadMessages: number;
  lastVisit: Visit | null;
}
