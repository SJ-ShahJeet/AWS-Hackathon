import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function routeForRole(role?: string | null) {
  if (role === "parent") return "/parent";
  if (role === "admin") return "/admin";
  return "/dashboard";
}
