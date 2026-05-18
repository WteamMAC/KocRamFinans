# 🏦 Koç Ram Finans — AI-Powered Personal Finance Platform

> **BTK Akademi Hackathon 2026** | Gemini API Zorunlu Kullanım Kategorisi

Koç Ram Finans; kişisel bütçe yönetimi, yatırım takibi, borç yapılandırma ve sosyal finans topluluğunu tek çatı altında toplayan, **Gemini API** ile güçlendirilmiş modern bir finans asisistanı platformudur.

---

## 🚀 Özellikler

| Modül | Açıklama |
|---|---|
| 📊 **Dashboard** | Net varlık, gelir/gider, borç, yatırım özeti — canlı piyasa fiyatlarıyla |
| 🤖 **AI Asistan** | 8 adet Function Calling Tool — kayıt ekle, sil, borç öde, piyasa sorgula |
| 📸 **Fiş Okuma** | Fatura/fiş fotoğrafı → AI otomatik gidere kaydeder (Multimodal) |
| 📈 **AI Projeksiyon** | Portföy için Gemini destekli 6 aylık büyüme tahmini |
| 💹 **Canlı Piyasa** | Yahoo Finance + ExchangeRate API + 5 dk DB önbellekleme |
| 🏛️ **BES Modülü** | Türkiye'ye özgü %30 devlet katkısı hesaplı emeklilik projeksiyonu |
| 🌍 **Çok Para Birimi** | TRY, USD, EUR, GBP, CHF, AED ve 10+ döviz desteği |
| 👥 **Topluluk** | Blog, yorum, beğeni, takip, DM, bildirim, topluluk oluşturma |
| 🎙️ **Sesli Komut** | Web Speech API ile Türkçe sesli kayıt girişi |

---

## 🏗️ Mimari

```
Next.js 16 (App Router)
├── src/app/api/chat/route.ts     ← Gemini Function Calling ana motoru
├── src/lib/gemini.ts              ← Master Prompt & finansal bağlam
├── src/lib/price-service.ts       ← Yahoo Finance + DB cache katmanı
├── src/lib/tefas-catalog.ts       ← TEFAS EMK fon kataloğu (merkezi kaynak)
├── src/app/actions/               ← Server Actions (13 modül)
└── src/components/dashboard/      ← 31 React bileşeni
```

**Gemini Kullanımı:**
- `@google/generative-ai` → AI Chat (Function Calling + Streaming)
- `@ai-sdk/google` → Smart Insights & AI Projeksiyon

---

## ⚙️ Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.development.local.example .env.local

# 3. Veritabanını oluştur
npm run db:push

# 4. Geliştirme sunucusunu başlat
npm run dev
```

---

## 🔑 Gerekli Ortam Değişkenleri

```env
# Gemini AI (ZORUNLU)
GEMINI_API_KEY=your_gemini_api_key

# Veritabanı (ZORUNLU)
DATABASE_URL=postgresql://...

# Kimlik Doğrulama - Clerk (ZORUNLU)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## 🛠️ Tech Stack

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 + React 19 |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Veritabanı | PostgreSQL + Prisma 7 |
| Auth | Clerk |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| Grafikler | Recharts |
| Piyasa | Yahoo Finance 2 + ExchangeRate API |
| Deploy | Vercel |

---

## ⚠️ Yasal Uyarı

Bu platform yalnızca kişisel finans takibi ve bilgilendirme amaçlıdır.  
**Yatırım Tavsiyesi Değildir (YTD).** Yatırım kararlarınızı bir finansal danışmana danışarak alın.
