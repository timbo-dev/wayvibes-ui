import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isZipPath(path: string) {
  return path.toLowerCase().endsWith(".zip");
}

export function toPercentage(value: number) {
  return Math.round(value * 100);
}
