import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MIN_PATTERN_LENGTH = 4;

export function formatTimeRemaining(milliseconds: number): string {
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const seconds = Math.floor((milliseconds / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function isValidPattern(pattern: string): boolean {
  return pattern.length >= MIN_PATTERN_LENGTH && pattern.includes(".");
}

export function sanitizeUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

export function downloadJsonFile(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        resolve(text);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
