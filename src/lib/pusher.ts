import PusherServer from "pusher";
import PusherClient from "pusher-js";

/**
 * Sunucu tarafı Pusher nesnesi (Server Actions / API route'larında çalışır).
 * Gerçek zamanlı olayları tetiklemek (trigger) için kullanılır.
 */
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || "mock_app_id",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_pusher_key",
  secret: process.env.PUSHER_SECRET || "mock_pusher_secret",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  useTLS: true,
});

/**
 * İstemci tarafı Pusher nesnesi (Tarayıcıda / Client Component'te çalışır).
 * Kanallara abone olmak (subscribe) için kullanılır.
 */
export const getPusherClient = () => {
  if (typeof window === "undefined") return null;
  
  // Eğer henüz gerçek key girilmemişse konsolu uyarı ile kirletmemek için kontrol
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || "mock_pusher_key";
  if (key === "mock_pusher_key") {
    console.warn("[Pusher] Gerçek Pusher anahtarı girilmediği için mock modunda çalışıyor. Lütfen .env dosyanızı güncelleyin.");
  }
  
  return new PusherClient(key, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
  });
};
