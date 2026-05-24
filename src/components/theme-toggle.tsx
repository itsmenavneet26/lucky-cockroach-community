"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [state, setState] = useState({ mounted: false, dark: false });

  useEffect(() => {
    // Sync to the theme the inline <head> script already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      mounted: true,
      dark: document.documentElement.classList.contains("dark"),
    });
  }, []);

  function toggle() {
    const next = !state.dark;
    setState({ mounted: true, dark: next });
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("lcc-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={state.dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
    >
      {state.mounted && state.dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
