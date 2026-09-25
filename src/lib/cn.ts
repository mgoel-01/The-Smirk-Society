import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, letting later Tailwind utilities win over
 * earlier ones of the same kind. Every animated component below takes a
 * `className`, so callers can retune spacing or colour without a fork.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
