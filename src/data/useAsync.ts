import { useEffect, useState } from "react";

/* One hook for every screen's data. Keeps loading and error handling in a
   single place so no screen invents its own — and so swapping the data layer
   later doesn't touch component code. */

export type AsyncState<T> = { data: T | null; loading: boolean; error: string | null };

/* `loading` goes true again on every refetch. Screens that guard on it alone
   unmount everything — including the button the patient just pressed, which
   drops focus to <body> and throws the scroll to the top. Guard on
   `loading && !data` instead; `data` is deliberately retained across a
   refetch so the previous render survives until the new one resolves. */

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));  // keeps `data`
    fn()
      .then((data) => { if (alive) setState({ data, loading: false, error: null }); })
      .catch(() => {
        if (alive) setState({ data: null, loading: false, error: "We couldn't load this just now." });
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
