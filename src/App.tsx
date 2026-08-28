import { useCallback, useEffect, useState } from "react";
import { useRoute } from "./router";
import { Shell } from "./ui/Shell";
import Home from "./screens/Home";
import Visits from "./screens/Visits";
import Messages from "./screens/Messages";
import Health from "./screens/Health";
import Billing from "./screens/Billing";
import Account from "./screens/Account";
import Crisis from "./screens/Crisis";
import Splash, { splashWanted } from "./Splash";
import Login from "./Login";
import { isSignedIn } from "./data/auth";
import { useAsync } from "./data/useAsync";
import * as api from "./data/api";
import { initials } from "./format";
import { say } from "./live";

const TITLES: Record<string, string> = {
  home: "Home", visits: "Visits", messages: "Messages",
  health: "Health", billing: "Billing", account: "Account", crisis: "Get help now",
};

export default function App() {
  const [splashing, setSplashing] = useState(splashWanted);
  const [authed, setAuthed] = useState(isSignedIn);

  const splashDone = useCallback(() => setSplashing(false), []);
  const signedIn = useCallback(() => setAuthed(true), []);

  if (splashing) return <Splash onDone={splashDone} />;
  if (!authed) return <Login onDone={signedIn} />;
  return <Portal onSignOut={() => setAuthed(false)} />;
}

function Portal({ onSignOut }: { onSignOut: () => void }) {
  const route = useRoute();
  const key = route.path.join("/");
  /* Refetched per route so the unread dot clears once the thread is read —
     the summary is one cheap call by design. */
  const { data } = useAsync(() => api.getHomeSummary(), [route.screen, key]);

  useEffect(() => {
    const name = TITLES[route.screen] ?? "Home";
    document.title = `${name} · My Blueprint`;
    window.scrollTo(0, 0);
    say(name);
    /* Move focus out of the page the user just left. Without this a route
       change drops focus to <body> and a screen reader says nothing. */
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [route.screen, key]);

  const who = data?.patient;
  return (
    <Shell
      initials={who ? initials(who.firstName, who.lastName) : "—"}
      unread={data?.unreadMessages ?? 0}
    >
      {route.screen === "home" && <Home />}
      {route.screen === "visits" && <Visits />}
      {route.screen === "messages" && <Messages />}
      {route.screen === "health" && <Health />}
      {route.screen === "billing" && <Billing />}
      {route.screen === "account" && <Account onSignOut={onSignOut} />}
      {route.screen === "crisis" && <Crisis />}
    </Shell>
  );
}
