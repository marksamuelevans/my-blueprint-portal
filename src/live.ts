import { useSyncExternalStore } from "react";

/* One polite live region for the whole app, kept in Shell so it is always
   mounted. A region inserted alongside its own content is not reliably
   announced, and this app unmounts the entire screen on every route change —
   so the region has to outlive the screens and only its TEXT may change.

   Same store shape as the router: no dependency, no context, no re-render of
   anything that isn't listening. */

let message = "";
const subs = new Set<() => void>();

export function say(text: string) {
  // Repeating identical text is not re-announced; nudge it so it is.
  message = text === message ? text + "​" : text;
  subs.forEach((f) => f());
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export const useAnnouncement = () =>
  useSyncExternalStore(subscribe, () => message, () => "");
