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

## 🏗️ Repo Haritası (Repository Map)

Projemiz Next.js 16 (App Router) mimarisiyle modern, ölçeklenebilir ve temiz bir yapıya sahiptir. Aşağıda uygulamanın temel dosya ve klasör dizilimi bulunmaktadır:

```text
BtkAkademiDeneme/
├── prisma/                        ← Veritabanı şeması ve migration'lar (PostgreSQL)
├── public/                        ← Statik dosyalar (resimler, ikonlar vb.)
├── src/
│   ├── app/                       ← Next.js 16 App Router ana sayfaları
│   │   ├── (auth)/                ← Kimlik doğrulama (Clerk) sayfaları ve akışları
│   │   ├── actions/               ← Server Actions (13 adet arka plan DB işlemi modülü)
│   │   ├── api/
│   │   │   └── chat/route.ts      ← 🧠 AI Agent Chatbot & Function Calling Core Endpoint
│   │   ├── dashboard/             ← Kullanıcı yönetim, finans ve raporlama paneli
│   │   ├── hakkimizda/            ← Kurumsal ve bilgilendirme statik sayfaları
│   │   └── onboarding/            ← Yeni kullanıcı giriş yapılandırma süreçleri
│   ├── components/                ← Yeniden kullanılabilir React/UI bileşenleri
│   │   └── dashboard/             ← Finansal grafik (Recharts) ve form bileşenleri (31 adet)
│   ├── context/                   ← React Context API ile global state yönetimleri
│   ├── lib/                       ← Yardımcı fonksiyonlar, servisler ve entegrasyonlar
│   │   ├── gemini.ts              ← Master Prompt, ajan kurgusu ve finansal bağlam ayarları
│   │   ├── price-service.ts       ← Canlı döviz, borsa ve emtia fiyatlandırma (Yahoo/ExchangeRate)
│   │   ├── tefas-catalog.ts       ← TEFAS (Türkiye Elektronik Fon Alım Satım) fon verileri
│   │   ├── utils.ts               ← Formatter, hesaplayıcı gibi genel yardımcı fonksiyonlar
│   │   └── prisma.ts              ← Prisma ORM bağlantı tanımlamaları
│   └── middleware.ts              ← Auth koruması ve rota yönlendirme middleware'i
├── components.json                ← shadcn/ui bileşen kütüphanesi konfigürasyonu
├── package.json                   ← Proje bağımlılıkları ve node scriptleri
├── tailwind.config.ts             ← Tailwind CSS tasarım ve renk tokenleri
└── tsconfig.json                  ← TypeScript derleyici ayarları
```

---

## 🤖 Ajan Rolleri ve Görevleri (AI Agent Functions)

Platform, kullanıcı ile doğal dilde etkileşime giren **Gemini 2.5** destekli bir asistan tarafından yönetilmektedir. Asistan, `Function Calling` yeteneği sayesinde aşağıda belirtilen spesifik ajan (tool) görevlerini otonom olarak çalıştırır:

1. 📥 **Veri Okuyucu Ajan (`getFinancialHistory`)**
   - **Görevi:** Kullanıcının geçmiş ve mevcut gelir, gider, borç ve yatırım kayıtlarını veritabanından çekerek finansal tabloyu analiz etmek için bağlam sağlar.
2. ✍️ **Kayıt Asistanı ve Görsel İşleyici (`addFinancialRecord`)**
   - **Görevi:** Doğal dille ifade edilen veya fotoğrafı yüklenen fiş/fatura gibi belgelerdeki verileri işleyip (Multimodal Vision) doğrudan veritabanına finansal kayıt olarak ekler.
3. 💳 **Borç Yönetim Ajanı (`payDebt`)**
   - **Görevi:** Kullanıcının kredilerini veya borç taksitlerini takip eder. Ödeme yapıldığında ilgili borcu bakiyeden düşer ve işlemi aynı zamanda bir gider olarak işler.
4. 🗑️ **Temizlik Ajanı (`deleteFinancialRecord`)**
   - **Görevi:** Hatalı girilmiş veya silinmesi talep edilen geçmiş finansal kayıtların benzersiz ID'sini tespit ederek sistemden güvenle kaldırır.
5. 💹 **Piyasa Analisti (`getMarketPrice`)**
   - **Görevi:** Kullanıcı canlı kripto, borsa (BIST, NASDAQ), altın veya döviz kuru sorduğunda internete çıkıp güncel verileri (TRY dönüşümlü) sağlar.
6. 📅 **Etkinlik Koordinatörü (`manageSpecialEvent`)**
   - **Görevi:** Doğum günleri, evlilik yıldönümleri veya belirli periyodik fatura ödeme günleri gibi kişisel ajanda verilerini kaydeder ve listeler.
7. ⚙️ **Profil Yöneticisi (`updateUserProfile`)**
   - **Görevi:** Kullanıcının tercih ettiği para birimi, isim bilgileri, finansal biyografisi ve ilgi alanlarını, sohbet akışından algılayarak sistem ayarlarında günceller.
8. 🌐 **Sosyal Topluluk Elçisi (`createCommunityPost`)**
   - **Görevi:** Kullanıcı sosyal bir etkileşimde bulunmak veya tecrübesini paylaşmak istediğinde onun adına Wteam forumlarında post paylaşır ve ilgili etiketleri atar.

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
