import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function standardizeInvestmentType(type: string): string {
  const upperType = String(type).toUpperCase();
  if (upperType.includes("KRİPTO") || upperType.includes("CRYPTO") || upperType.includes("BITCOIN") || upperType.includes("BTC")) return "CRYPTO";
  if (upperType.includes("GOLD") || upperType.includes("ALTIN") || upperType.includes("GÜMÜŞ") || upperType.includes("EMTİA") || upperType.includes("XAU")) return "GOLD";
  if (upperType.includes("NASDAQ") || upperType.includes("ABD") || upperType.includes("USA") || upperType.includes("NYSE")) return "NASDAQ";
  return "BIST";
}
