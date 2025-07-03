import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Altri helper se vuoi aggiungerli:
export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("it-IT")
}
