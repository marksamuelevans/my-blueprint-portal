import { useEffect, useRef, useState } from "react";
import "./splash.css";

/* Opening splash (once per tab session, ~4s). Same structure and timing as
   BlueprintOS: the ring draws itself closed, the dot blooms inside it, then
   the wordmark rises through a line mask. Click, tap, or any key skips it.
   prefers-reduced-motion collapses everything to a static brand frame that
   leaves early. */

const SEEN_KEY = "mb_splashed";

export function splashWanted(): boolean {
  try { return !sessionStorage.getItem(SEEN_KEY); } catch { return false; }
}

export default function Splash({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const HOLD = reduced ? 900 : 3600; // exit starts here; fade lasts 400ms
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setOut(true);
      window.setTimeout(onDone, 420);
    };
    const t = window.setTimeout(finish, HOLD);
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [onDone]);

  return (
    <div className={`splash${out ? " out" : ""}`} role="status" aria-label="My Blueprint is starting">
      <div className="splash-inner" aria-hidden="true">
        <span className="splash-mark">
          <svg className="splash-draw" viewBox="0 0 72 72" width="72" height="72">
            <circle className="splash-draw-ring" cx="36" cy="36" r="33" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            <circle className="splash-draw-dot" cx="36" cy="36" r="33" />
          </svg>
        </span>
        <span className="splash-wordmark">
          <span className="splash-line"><span className="splash-word splash-word-1">MY</span></span>
          <span className="splash-line"><span className="splash-word splash-word-2">BLUEPRINT</span></span>
        </span>
      </div>
    </div>
  );
}
