// src/lib/rate-limit.ts
import { NextRequest } from "next/server";

// Not: Gerçek bir üretim ortamında Redis (Upstash vb.) kullanılmalıdır.
// Bu örnekte basit bir in-memory yapı kullanılmıştır.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const LIMIT = 10; // 15 saniyede maksimum 10 mesaj
const WINDOW = 15 * 1000; // 15 saniye

export async function checkRateLimit(req: NextRequest, userId: string) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const key = `rate-limit:${userId || ip}`;
  
  const now = Date.now();
  const userData = rateLimitMap.get(key) || { count: 0, lastReset: now };

  if (now - userData.lastReset > WINDOW) {
    userData.count = 0;
    userData.lastReset = now;
  }

  userData.count++;
  rateLimitMap.set(key, userData);

  return {
    success: userData.count <= LIMIT,
    remaining: Math.max(0, LIMIT - userData.count),
    reset: userData.lastReset + WINDOW
  };
}
