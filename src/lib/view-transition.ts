"use client";

import { flushSync } from "react-dom";

// Wraps a state update in the View Transitions API for a smooth page-wide
// crossfade. Falls back to an instant update in unsupported browsers.
export function withViewTransition(update: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void;
  };
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduceMotion) {
    doc.startViewTransition(() => {
      flushSync(update);
    });
  } else {
    update();
  }
}
