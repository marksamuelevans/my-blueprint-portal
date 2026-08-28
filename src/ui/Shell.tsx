import type { ReactNode } from "react";
import { TABS, href, useRoute } from "../router";
import { Icon } from "./icons";
import { useAnnouncement } from "../live";

const TAB_META: Record<string, { label: string; icon: string }> = {
  home: { label: "Home", icon: "home" },
  visits: { label: "Visits", icon: "calendar" },
  messages: { label: "Messages", icon: "message" },
  health: { label: "Health", icon: "heart" },
  billing: { label: "Billing", icon: "card" },
};

export function Shell({
  children, initials, unread = 0,
}: { children: ReactNode; initials: string; unread?: number }) {
  const route = useRoute();
  const announce = useAnnouncement();
  return (
    <div className="app">
      <div className="shell-head">
        <header className="top">
          <div className="top-inner">
            <span className="mark" aria-hidden="true" />
            <span className="wordmark"><span className="my">MY</span> BLUEPRINT</span>
            <span className="spacer" />
            {/* A navigation is a link: it can be opened in a new tab, and it
                announces as a link rather than as a button that does nothing
                a button does. */}
            <a className="avatar" href={href("account")} aria-label="Your account">
              {initials}
            </a>
          </div>
        </header>

        {/* On desktop this row sits under the header; on phones it is fixed to the bottom. */}
        <nav className="tabs" aria-label="Main">
          {TABS.map((t) => (
            <a
              key={t}
              href={href(t)}
              className={route.screen === t ? "on" : ""}
              aria-current={route.screen === t ? "page" : undefined}
              aria-label={t === "messages" && unread > 0
                ? `Messages, ${unread} unread` : undefined}
            >
              <span className="ic">
                <Icon name={TAB_META[t].icon} size={22} />
                {t === "messages" && unread > 0 && <span className="dot" aria-hidden="true" />}
              </span>
              {TAB_META[t].label}
            </a>
          ))}
        </nav>
      </div>

      {/* One region, always mounted. Live regions inserted alongside their own
          content are not reliably announced, and this app unmounts the whole
          screen on every route change. */}
      <p className="sr-only" aria-live="polite" role="status">{announce}</p>

      <main className="main" id="main" tabIndex={-1}>
        {children}
        <a className="crisis-link" href={href("crisis")}>Need help now?</a>
      </main>
    </div>
  );
}
