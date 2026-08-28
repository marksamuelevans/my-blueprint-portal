import type {
  Billing, DocumentItem, FormTask, Insurance, Medication, Patient, Thread, Visit,
} from "./types";

/* Demo data — one believable patient, deliberately.

   Enough to exercise every screen and every empty state, small enough to hold
   in your head. Dates are generated relative to today so the sandbox never
   goes stale and the "starts in 8 minutes" states stay reachable. */

const day = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 19);
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number, hour: number, minute = 0) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const patient: Patient = {
  firstName: "Alex",
  lastName: "Rivera",
  preferredName: "Alex",
  dob: "1992-04-18",
  email: "alex.rivera@example.com",
  mobile: "(615) 555-0147",
  accountType: "adult",
};

const bailey = { name: "Bailey Dryden", credential: "PMHNP-BC" };

export const visits: Visit[] = [
  {
    id: "v-next",
    startAt: iso(shift(6, 10, 0)),
    endAt: iso(shift(6, 10, 30)),
    provider: bailey,
    kind: "Follow-up",
    telehealth: true,
    status: "scheduled",
    afterVisitSummary: null,
  },
  {
    id: "v-past-1",
    startAt: iso(shift(-26, 10, 0)),
    endAt: iso(shift(-26, 10, 30)),
    provider: bailey,
    kind: "Follow-up",
    telehealth: true,
    status: "completed",
    afterVisitSummary:
      "We kept sertraline at 100 mg and agreed to review sleep again next visit. You mentioned mornings have been easier over the last two weeks. Before we meet again, try to note any days where sleep drops below six hours.",
  },
  {
    id: "v-past-2",
    startAt: iso(shift(-56, 14, 0)),
    endAt: iso(shift(-56, 15, 0)),
    provider: bailey,
    kind: "New patient evaluation",
    telehealth: true,
    status: "completed",
    afterVisitSummary:
      "We started sertraline at 50 mg and talked through what to expect in the first few weeks. Reach out any time if side effects feel hard to manage — that is not something to wait out.",
  },
];

export const medications: Medication[] = [
  {
    id: "m-1",
    name: "Sertraline",
    strength: "100 mg",
    sig: "Once daily",
    prescriber: "Bailey Dryden",
    controlled: false,
    refill: null,
  },
  {
    id: "m-2",
    name: "Lisdexamfetamine",
    strength: "40 mg",
    sig: "Once daily in the morning",
    prescriber: "Bailey Dryden",
    controlled: true,
    refill: null,
  },
];

export const threads: Thread[] = [
  {
    id: "t-1",
    subject: "Question about morning dose",
    updatedAt: iso(shift(-1, 15, 12)),
    unread: true,
    messages: [
      {
        id: "msg-1",
        from: "patient",
        authorName: "Alex",
        body: "Is it alright to take the morning medication a couple of hours later on weekends?",
        sentAt: iso(shift(-2, 9, 4)),
      },
      {
        id: "msg-2",
        from: "care_team",
        authorName: "Care team",
        body: "Yes — shifting it a little later on weekends is fine. Try to keep it within the same few hours each day so sleep stays steady. Bring it up at your next visit if the difference feels noticeable.",
        sentAt: iso(shift(-1, 15, 12)),
      },
    ],
  },
];

export const formsDue: FormTask[] = [
  { id: "f-1", title: "How you've been feeling", minutes: 3, dueBeforeVisitId: "v-next" },
  { id: "f-2", title: "Update your pharmacy", minutes: 2, dueBeforeVisitId: "v-next" },
];

export const billing: Billing = {
  balanceCents: 4500,
  cardOnFile: { brand: "Visa", last4: "4242" },
  statements: [
    { id: "s-1", date: dateOnly(shift(-26, 12)), description: "Follow-up visit", amountCents: 4500, paid: false },
    { id: "s-2", date: dateOnly(shift(-56, 12)), description: "New patient evaluation", amountCents: 6000, paid: true },
  ],
};

export const insurance: Insurance = {
  payer: "BlueCross BlueShield of Tennessee",
  memberId: "XYZ123456789",
  status: "active",
  copayCents: 4500,
  checkedAt: dateOnly(shift(-6, 12)),
};

export const documents: DocumentItem[] = [
  { id: "d-1", title: "Visit summary", date: dateOnly(shift(-26, 12)), kind: "after_visit" },
  { id: "d-2", title: "Visit summary", date: dateOnly(shift(-56, 12)), kind: "after_visit" },
  { id: "d-3", title: "Telehealth consent", date: dateOnly(shift(-58, 12)), kind: "consent" },
];
