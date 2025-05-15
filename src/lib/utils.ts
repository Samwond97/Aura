import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get a language-specific text value
export function getLocalizedText(key: string, language: string, fallback: string): string {
  // Implement actual translations as needed
  const translations: Record<string, Record<string, string>> = {
    // Add translations as needed
  };
  
  if (translations[key] && translations[key][language]) {
    return translations[key][language];
  }
  
  return fallback;
}
