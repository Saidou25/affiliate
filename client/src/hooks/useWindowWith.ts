import { useEffect, useState } from "react";

export function useWindowWidth(debounceMs = 100) {
  const getSize = () => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [size, setSize] = useState(getSize);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let t: number | undefined;

    const onResize = () => {
      if (debounceMs <= 0) {
        setSize(getSize());
        return;
      }
      window.clearTimeout(t);
      t = window.setTimeout(() => setSize(getSize()), debounceMs);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    // run once to ensure accurate on mount
    onResize();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.clearTimeout(t);
    };
  }, [debounceMs]);

  return size; // { width, height }
}
