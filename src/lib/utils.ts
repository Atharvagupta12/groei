import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ConvexError } from "convex/values";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Gets a user-friendly message out of a Convex or unknown error. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ConvexError) {
    return typeof error.data === "string" ? error.data : fallback;
  }
  return fallback;
}

/** 75 -> "1:15", 3725 -> "1:02:05" */
export function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ss = seconds.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${ss}` : `${minutes}:${ss}`;
}

/** 1234 -> "1.2K" */
export function formatCount(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function timeAgo(timestamp: number) {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (seconds >= size) return rtf.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}
