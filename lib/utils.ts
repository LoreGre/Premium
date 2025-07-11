import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSku(s: string): string {
  return s.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}


