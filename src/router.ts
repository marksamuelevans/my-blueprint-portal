import { useSyncExternalStore } from "react";

/* Hash router — no dependency, no server config, works on any static host.
   "#visits/v-next" → { tab: "visits", path: ["v-next"] } */

export const TABS = ["home", "visits", "messages", "health", "billing"] as const;
export type Tab = (typeof TABS)[number];
export const OTHER = ["account", "crisis"] as const;
const KNOWN = new Set<string>([...TABS, ...OTHER]);

export interface Route { screen: string; path: string[] }

export function parse(hash: string): Route {
  const h = (hash.startsWith("#") ? hash.slice(1) : hash).replace(/^\//, "");
  const segs = h.split("/").filter(Boolean).map(decodeURIComponent);
  const screen = (segs.shift() ?? "").toLowerCase();
  return KNOWN.has(screen) ? { screen, path: segs } : { screen: "home", path: [] };
}

export const href = (screen: string, ...path: string[]) =>
  "#" + [screen, ...path.map(encodeURIComponent)].join("/");

export function navigate(screen: string, ...path: string[]) {
  window.location.hash = href(screen, ...path).slice(1);
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  return parse(hash);
}
