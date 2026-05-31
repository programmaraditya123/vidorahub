"use client";

import { useEffect } from "react";

type LockedStyle = {
  overflow: string;
  overflowY: string;
  touchAction: string;
};

function collectScrollableElements(excludeRoot?: HTMLElement | null): HTMLElement[] {
  const result: HTMLElement[] = [];

  document.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el === document.body || el === document.documentElement) return;
    if (excludeRoot?.contains(el)) return;

    const { overflowY } = window.getComputedStyle(el);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      result.push(el);
    }
  });

  return result;
}

/**
 * Prevents background scroll while a modal/overlay is open.
 * Locks documentElement, body, and any nested overflow scroll containers.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const lockedStyles = new Map<HTMLElement, LockedStyle>();

    const lockElement = (el: HTMLElement) => {
      lockedStyles.set(el, {
        overflow: el.style.overflow,
        overflowY: el.style.overflowY,
        touchAction: el.style.touchAction,
      });
      el.style.overflow = "hidden";
      el.style.overflowY = "hidden";
      el.style.touchAction = "none";
    };

    const modalRoot = document.getElementById("product-modal-root");

    lockElement(document.documentElement);
    lockElement(document.body);
    collectScrollableElements(modalRoot).forEach(lockElement);

    return () => {
      lockedStyles.forEach((prev, el) => {
        el.style.overflow = prev.overflow;
        el.style.overflowY = prev.overflowY;
        el.style.touchAction = prev.touchAction;
      });
      lockedStyles.clear();
    };
  }, [locked]);
}
