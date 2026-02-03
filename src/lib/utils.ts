import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ARCHIVE_EXTENSIONS = [
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".tar.gz",
  ".tgz",
  ".gz",
];

export function isArchivePath(path: string) {
  const lower = path.toLowerCase();
  return ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isZipPath(path: string) {
  return isArchivePath(path);
}

export function toPercentage(value: number) {
  return Math.round(value * 100);
}
