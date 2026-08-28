import { useEffect, useState } from "react";

/* One hook for every screen's data. Keeps loading and error handling in a
   single place so no screen invents its own — and so swapping the data layer
   later doesn't touch component code. */

export type AsyncState<T> = { data: T | null; loading: boolean; error: string | null };

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
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
