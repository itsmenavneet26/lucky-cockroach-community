import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
}

const UNITS: [number, string][] = [
  [60, "s"],
  [60, "m"],
  [24, "h"],
  [7, "d"],
  [4.345, "w"],
  [12, "mo"],
];

export function timeAgo(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  let diff = (Date.now() - then.getTime()) / 1000;
  if (diff < 45) return "just now";
  let unit = "s";
  for (const [step, label] of UNITS) {
    if (diff < step) {
      unit = label;
      break;
    }
    diff /= step;
    unit = label;
  }
  if (unit === "s") return "just now";
  return `${Math.floor(diff)}${unit} ago`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
