"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("patchledger:theme", callback);
  return () => window.removeEventListener("patchledger:theme", callback);
}

function currentTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark" as const);

  useEffect(() => {
    // cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") window.dispatchEvent(new Event("patchledger:theme"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    window.dispatchEvent(new Event("patchledger:theme"));
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // storage unavailable; theme still applies for this page
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative grid h-9 w-9 place-items-center border border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink)] ${className}`}
    >
      <span className={`theme-icon ${theme === "dark" ? "" : "theme-icon-hidden"}`}>
        <SunIcon />
      </span>
      <span className={`theme-icon ${theme === "dark" ? "theme-icon-hidden" : ""}`}>
        <MoonIcon />
      </span>
    </button>
  );
}
