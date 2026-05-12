// src/lib/rate-limit.ts
import { NextRequest } from "next/server";

/**
 * ÖNEMLİ: Bu basit bir in-memory hız sınırlayıcıdır.
 * Üretim (Production) ortamında Redis (Upstash) kullanılması önerilir.
 */

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const LIMIT = 15; // 1 dakika içinde maks 15 mesaj
const WINDOW = 60 * 1000; // 1 dakika

export async function checkRateLimit(req: NextRequest, userId: string) {
  // IP veya User ID bazlı anahtar
  const forward = req.headers.get("x-forwarded-for");
  const ip = typeof forward === "string" ? forward.split(",")[0] : "anonymous";
  const key = `rate-limit:${userId || ip}`;
  
  const now = Date.now();
  const userData = rateLimitMap.get(key) || { count: 0, lastReset: now };

  // Pencere süresi dolduysa sıfırla
  if (now - userData.lastReset > WINDOW) {
    userData.count = 0;
    userData.lastReset = now;
  }

  userData.count++;
  rateLimitMap.set(key, userData);

  const success = userData.count <= LIMIT;

  return {
    success,
    remaining: Math.max(0, LIMIT - userData.count),
    reset: userData.lastReset + WINDOW
  };
}
