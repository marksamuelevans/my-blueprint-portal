import type {
  Billing, CareTeamMember, CheckinQuestion, CheckinResult, DocumentItem, FormTask,
  Insurance, Medication, Patient, PracticeItem, Thread, TherapyGoal, Visit,
} from "./types";

/* Demo data — one believable patient, deliberately.

   Enough to exercise every screen and every empty state, small enough to hold
   in your head. Dates are generated relative to today so the sandbox never
   goes stale and the "starts in 8 minutes" states stay reachable. */

const day = 86_400_000;

/* LOCAL ISO, not UTC.

   toISOString() converts to UTC, and slicing the Z off leaves a string that
   Date.parse then reads back as LOCAL — so every fixture time was silently
   shifted by the timezone offset. A visit written as 10:00 was displaying as
   3:00 PM in Central. Everything downstream (until(), joinable(), the
   waiting-room window) inherited the error. */
const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
  `T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const dateOnly = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const shift = (days: number, hour: number, minute = 0) => {
  const d = new Date(Date.now() + days * day);
  d.setHours(hour, minute, 0, 0);
  return d;
};
/* The demo's next visit is always about to start, so the waiting room and the
   call are reachable the moment anyone opens the sandbox — a telehealth demo
   you can only see for 5 minutes a day is not a demo. */
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000);

export const patient: Patient = {
  firstName: "Alex",
  lastName: "Rivera",
  preferredName: "Alex",
  dob: "1992-04-18",
  email: "alex.rivera@example.com",
  mobile: "(615) 555-0147",
  accountType: "adult",
};

/* Alex sees both a prescriber and a therapist — the case that actually
   exercises the track logic. Flip either out of careTeam to see the
   single-track experience. */
const bailey = { name: "Bailey Dryden", credential: "PMHNP-BC", track: "psychiatry" as const };
const maya = { name: "Maya Ellison", credential: "LCSW", track: "therapy" as const };

export const careTeam: CareTeamMember[] = [
  {
    ...bailey,
    id: "p-1",
    role: "Prescriber",
    cadence: "Every 2 months",
    since: dateOnly(shift(-56, 12)),
  },
  {
    ...maya,
    id: "p-2",
    role: "Therapist",
    cadence: "Every 2 weeks",
    since: dateOnly(shift(-42, 12)),
  },
];

export const visits: Visit[] = [
  {
    id: "v-therapy-next",
    startAt: iso(minutesFromNow(4)),
    endAt: iso(minutesFromNow(54)),
    provider: maya,
    kind: "Therapy session",
    track: "therapy",
    telehealth: true,
    status: "scheduled",
    afterVisitSummary: null,
  },
  {
    id: "v-next",
    startAt: iso(shift(6, 10, 0)),
    endAt: iso(shift(6, 10, 30)),
    provider: bailey,
    kind: "Medication follow-up",
    track: "psychiatry",
    telehealth: true,
    status: "scheduled",
    afterVisitSummary: null,
  },
  {
    id: "v-past-1",
    startAt: iso(shift(-26, 10, 0)),
    endAt: iso(shift(-26, 10, 30)),
    provider: bailey,
    kind: "Medication follow-up",
    track: "psychiatry",
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
    track: "psychiatry",
    telehealth: true,
    status: "completed",
    afterVisitSummary:
      "We started sertraline at 50 mg and talked through what to expect in the first few weeks. Reach out any time if side effects feel hard to manage — that is not something to wait out.",
  },
];

export const therapyPast: Visit = {
  id: "v-therapy-past",
  startAt: iso(shift(-12, 15, 0)),
  endAt: iso(shift(-12, 15, 50)),
  provider: maya,
  kind: "Therapy session",
  track: "therapy",
  telehealth: true,
  status: "completed",
  /* Therapy summaries are written in a different voice than medication
     ones — what we worked on, not what we changed. */
  afterVisitSummary:
    "We spent most of the session on the Sunday-evening dread and where it starts. You noticed it lifts when the week already has one thing in it you chose. Before we meet again, see whether naming the dread out loud when it arrives changes how long it stays.",
};

visits.push(therapyPast);

export const goals: TherapyGoal[] = [
  {
    id: "g-1",
    title: "Get through Sunday evenings",
    detail: "Sunday nights turn into a spiral about the whole week ahead.",
    addedAt: dateOnly(shift(-42, 12)),
  },
  {
    id: "g-2",
    title: "Say the hard thing at work sooner",
    detail: "I sit on things for weeks and then they come out badly.",
    addedAt: dateOnly(shift(-28, 12)),
  },
];

export const practice: PracticeItem[] = [
  {
    id: "pr-1",
    title: "Name the dread out loud",
    detail: "When Sunday evening starts, say what you notice out loud — once, plainly.",
    fromVisitId: "v-therapy-past",
    done: false,
  },
  {
    id: "pr-2",
    title: "One chosen thing in the week",
    detail: "Put one thing you actually want into the week before it fills up.",
    fromVisitId: "v-therapy-past",
    done: true,
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
    withProviderId: "p-1",
    withName: "Bailey Dryden",
    track: "psychiatry",
    awaitingReply: false,
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
        authorName: "Bailey Dryden",
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


/* PHQ-9 then GAD-7, in their published order. Item 9 of the PHQ carries the
   safety flag and is the reason this form is not just a list of radios. */
export const checkinQuestions: CheckinQuestion[] = [
  { id: "p1", scale: "phq9", text: "Little interest or pleasure in doing things" },
  { id: "p2", scale: "phq9", text: "Feeling down, depressed, or hopeless" },
  { id: "p3", scale: "phq9", text: "Trouble falling or staying asleep, or sleeping too much" },
  { id: "p4", scale: "phq9", text: "Feeling tired or having little energy" },
  { id: "p5", scale: "phq9", text: "Poor appetite or overeating" },
  { id: "p6", scale: "phq9", text: "Feeling bad about yourself — or that you are a failure, or have let yourself or your family down" },
  { id: "p7", scale: "phq9", text: "Trouble concentrating on things, such as reading or watching television" },
  { id: "p8", scale: "phq9", text: "Moving or speaking so slowly that other people could have noticed — or being so restless that you have been moving a lot more than usual" },
  { id: "p9", scale: "phq9", safety: true, text: "Thoughts that you would be better off dead, or of hurting yourself in some way" },
  { id: "g1", scale: "gad7", text: "Feeling nervous, anxious, or on edge" },
  { id: "g2", scale: "gad7", text: "Not being able to stop or control worrying" },
  { id: "g3", scale: "gad7", text: "Worrying too much about different things" },
  { id: "g4", scale: "gad7", text: "Trouble relaxing" },
  { id: "g5", scale: "gad7", text: "Being so restless that it is hard to sit still" },
  { id: "g6", scale: "gad7", text: "Becoming easily annoyed or irritable" },
  { id: "g7", scale: "gad7", text: "Feeling afraid, as if something awful might happen" },
];

export const checkins: CheckinResult[] = [];
