import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEventTime(time: string) {
  const date = new Date(`2000-01-01T${time}`)
  const hours = date.getHours()
  const minutes = format(date, "mm")
  const period = hours >= 12 ? "PM" : "AM"
  
  // Convert to 12-hour format
  let displayHours = hours % 12
  // Use 12 for noon and midnight instead of 0
  displayHours = displayHours === 0 ? 12 : displayHours
  
  return `${displayHours}:${minutes} ${period}`
}
