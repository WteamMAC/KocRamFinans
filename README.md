# 🏦 Koç Ram Finans — AI-Powered Personal Finance Platform

> **BTK Akademi Hackathon 2026** | Gemini API Zorunlu Kullanım Kategorisi
> 
> Koç Ram Finans; kişisel bütçe yönetimi, yatırım takibi, borç yapılandırma, otonom yapay zeka asistanlığı ve sosyal finans topluluğunu tek çatı altında birleştiren, **Gemini API** ile güçlendirilmiş son teknoloji ve premium bir kişisel finans asistanı platformudur.

---

## 🌟 Öne Çıkan Modüller ve Özellikler

| Modül | Detaylı Açıklama | Teknolojik Altyapı |
| :--- | :--- | :--- |
| 📊 **Akıllı Dashboard** | Canlı piyasa fiyatlarıyla değerlenen net varlık, gelir/gider akışı, borç durumları ve yatırım portföyünün anlık grafiksel özeti. | React 19 + Recharts + Tailwind CSS v4 |
| 🤖 **Ajanlık Yapay Zeka (AI Agent)** | Metin, ses veya görsel tabanlı girdileri işleyebilen, 8 farklı araca (Tool) sahip otonom finansal danışman. | Gemini Pro/Flash (Function Calling) |
| 📸 **Multimodal OCR (Fiş/Fatura)** | Fiş veya fatura fotoğraflarını tarayarak toplam tutarı, KDV'yi, kategoriyi ve tarihi otomatik algılar, doğrudan gidere işler. | Gemini Vision + Base64 Stream |
| 📈 **AI Projeksiyon & Öngörü** | Mevcut portföy varlıklarının küresel enflasyon ve piyasa beklentilerine göre 6 aylık büyümesini otonom olarak simüle eder. | Gemini Analiz Ajanı + DB Insights |
| 💹 **Canlı Piyasa & Caching** | Hisse senetleri (BIST, NASDAQ), kripto paralar, döviz kurları ve emtiaların (Altın, Gümüş, Brent) canlı takibi. | Yahoo Finance 2 + ExchangeRate API (5 Dk DB Caching) |
| 🏛️ **Gelişmiş BES Modülü** | Türkiye'ye özgü %30 devlet katkısı hesaplamalı, seçilen fon türüne (Altın, Hisse, Muhafazakar vb.) göre birikim projeksiyonu. | Bireysel Emeklilik Matematiksel Modeli |
| 📅 **Finansal Takvim & Özel Günler** | Periyodik faturalar, kredi taksitleri ve doğum günleri gibi finansal ya da kişisel özel günlerin ajanda entegrasyonu. | Prisma SpecialEvents Engine |
| 👥 **Sosyal Finans Topluluğu** | Kullanıcıların blog gönderileri paylaşabildiği, yorum yapıp beğendiği, birbirini takip ettiği ve canlı mesajlaştığı sosyal platform. | Pusher Realtime + Communities API |
| 🎙️ **Sesli Komut Entegrasyonu** | Mikrofon simgesine basıp konuşarak ("Dün 500 TL market harcaması yaptım") sesli finansal kayıt girişi yapma. | Web Speech API |
| 📥 **Excel Veri Raporlama** | Tüm finansal geçmişi ve varlık listelerini saniyeler içinde Excel formatında dışa aktarma (export). | SheetJS (`xlsx`) |

---

## 🧠 AI Ajan Mimarisi (Agentic System Architecture)

Koç Ram Finans, klasik sohbet botlarının aksine **otonom karar alma yeteneğine sahip bir Multi-Agent (Çoklu Ajan) sistemi** üzerine kurulmuştur. Master model, kullanıcının niyetini analiz ederek 8 farklı fonksiyondan birini veya birkaçını sırayla (Chain-of-Thought) otonom olarak çalıştırır.

```mermaid
flowchart TD
    %% Müşteri Girdisi
    User((🗣️ Müşteri Girdisi <br/> Metin / Ses / Fiş Görseli)) -->|Input| Master[🧠 Gemini Master Agent <br/> Sistem Promptu & Bağlam]
    
    %% Karar Ağacı
    Master -->|AI Yönlendirmesi| Router{Otonom Görev Yönlendirici}
    Master -->|AI Yanıtı| Reply[💬 Doğrudan Zarif Yanıt]
    Reply -.->|Cevap| User
    
    %% Otonom Ajanlar (Tools)
    Router -->|API Tetikleme| T1[📥 Veri Okuyucu <br/> getFinancialHistory]
    Router -->|API Tetikleme| T2[✍️ Kayıt Asistanı <br/> addFinancialRecord]
    Router -->|API Tetikleme| T3[💳 Borç Yöneticisi <br/> payDebt]
    Router -->|API Tetikleme| T4[💹 Piyasa Analisti <br/> getMarketPrice]
    Router -->|API Tetikleme| T5[🗑️ Temizlik Ajanı <br/> deleteFinancialRecord]
    Router -->|API Tetikleme| T6[📅 Koordinatör <br/> manageSpecialEvent]
    Router -->|API Tetikleme| T7[⚙️ Profil Ajanı <br/> updateUserProfile]
    Router -->|API Tetikleme| T8[🌐 Topluluk Elçisi <br/> createCommunityPost]
    
    %% Veritabanı ve Arayüz
    T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 ==>|Veri İşleme & Kayıt| DB[(🗄️ PostgreSQL Veritabanı)]
    DB ==>|Realtime Revalidate| UI[✨ Dashboard Anında Güncellenir]
    
    %% Stiller
    style Master fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff
    style Router fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff
    style DB fill:#0ea5e9,stroke:#fff,stroke-width:2px,color:#fff
    style UI fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff
```

### 🛠️ Canlı API Araçları (Function Calling Tools)

Sistemdeki yapay zeka asistanımız arka planda şu otonom araçları yönetir ve kullanıcının bütçe durumunu anlık olarak veritabanından okuyup bağlam (context) olarak hafızasına alır.

| Araç (Tool) İsmi | İkon | Görevi ve Yeteneği |
| :--- | :---: | :--- |
| **`getFinancialHistory`** | 📥 | Kullanıcının geçmiş ve mevcut gelir, gider, borç ve yatırım kayıtlarını okur. |
| **`addFinancialRecord`** | ✍️ | Doğal dille ifade edilen veya resmi yüklenen fişlerdeki verileri algılayıp doğrudan veritabanına ekler *(TRY, USD, EUR vb. 10+ döviz desteğiyle)*. |
| **`payDebt`** | 💳 | Taksitli veya tek seferlik borç ödemelerini otonom gerçekleştirir, bakiyeyi düşer ve aynı zamanda gider tablosuna kaydeder. |
| **`deleteFinancialRecord`** | 🗑️ | Hatalı girilmiş finansal kayıtları benzersiz ID'si üzerinden tespit eder ve güvenli bir şekilde siler. |
| **`getMarketPrice`** | 💹 | Canlı borsa (BIST, NASDAQ), kripto, altın ve döviz fiyatlarını Yahoo Finance üzerinden çekip TRY karşılıklarıyla analiz eder. |
| **`manageSpecialEvent`** | 📅 | Hatırlatıcıları ve periyodik fatura ödeme tarihlerini finansal ajandaya kaydeder. |
| **`updateUserProfile`** | ⚙️ | Kullanıcının varsayılan para birimini, ilgi alanlarını ve biyografisini sohbet üzerinden günceller. |
| **`createCommunityPost`** | 🌐 | Kullanıcı adına Wteam sosyal forumlarında anında paylaşım (post) yapar. |

### 🛡️ Akıllı Hata Toleransı & Fallback Stratejisi
Herhangi bir Gemini modelinde ağ hatası veya kota aşımı (Rate Limit - 429) olması durumunda, sistem kesintiyi önlemek amacıyla modern modeller arasında **otomatik olarak fallback (yedek modele geçiş) yapar**:
```typescript
const FALLBACK_MODELS = [
  "gemini-3.1-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash"
];
```

---

## 📊 Veritabanı Mimarisi (Entity-Relationship Modeli)

Veritabanımız, PostgreSQL üzerinde **Prisma ORM** kullanılarak yapılandırılmıştır. Tüm modeller birebir ilişkisel ve kaskad (cascade) silme özelliklerine sahiptir. Veri bütünlüğünü sağlamak adına devasa ve ölçeklenebilir bir yapı kurulmuştur.

```mermaid
erDiagram
    USER ||--o{ INCOME : "sahiptir"
    USER ||--o{ EXPENSE : "yapar"
    USER ||--o{ DEBT : "borçlanır"
    USER ||--o{ INVESTMENT : "yatırım_yapar"
    USER ||--o{ FIXED_ASSET : "mülk_edinir"
    USER ||--o{ SPECIAL_EVENT : "planlar"
    USER ||--o{ BLOG_POST : "yazar"
    USER ||--o{ COMMUNITY : "yönetir"
    USER ||--o{ MESSAGE : "DM_atar"
    USER ||--o{ NOTIFICATION : "bildirim_alir"

    USER {
        String id PK "Benzersiz Kimlik"
        String clerkUserId UK "Clerk Auth ID"
        String username "Kullanıcı Adı"
        String email "E-Posta"
        String currency "TRY, USD, EUR vb."
        String country "Ülke Kodu"
        String[] interests "Hashtag'ler"
        DateTime createdAt "Kayıt Tarihi"
    }
    INVESTMENT {
        String id PK "Benzersiz Kimlik"
        String type "GOLD, CRYPTO, BIST, BES, FAIZ vs"
        String symbol "BTC-USD, THYAO.IS vs"
        Float quantity "Alınan Adet/Miktar"
        Float purchasePrice "Alış Birim Fiyatı"
        Float amount "Toplam Değer"
        String status "OPEN veya CLOSED"
        DateTime createdAt "İşlem Tarihi"
    }
    DEBT {
        String id PK "Benzersiz Kimlik"
        Float amount "Kalan Toplam Borç"
        Float principalAmount "Ana Para"
        Float interestRate "Aylık Faiz Oranı"
        Float installmentAmount "Aylık Taksit Tutarı"
        Int remainingInstallments "Kalan Taksit Sayısı"
        DateTime dueDate "Son Ödeme Tarihi"
    }
    INCOME {
        String id PK "Benzersiz Kimlik"
        Float amount "Tutar"
        String type "Maaş, Kira, Ek İş vb."
        String currency "Para Birimi"
        Boolean isRecurring "Düzenli Gelir mi?"
        DateTime date "İşlem Tarihi"
    }
    EXPENSE {
        String id PK "Benzersiz Kimlik"
        Float amount "Tutar"
        String type "Market, Fatura, Yakıt vb."
        String currency "Para Birimi"
        Boolean isRecurring "Düzenli Gider mi?"
        DateTime date "İşlem Tarihi"
    }
    MARKET_PRICE_CACHE {
        String symbol PK "Örn: USDTRY=X, BTC-USD"
        Float price "Canlı Fiyat"
        Float changePct "Değişim Yüzdesi"
        DateTime updatedAt "5Dk Cache Süresi"
    }
```

---

## 🛠️ Kurulum ve Geliştirme Ortamı

Sistemi yerel ortamda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/WteamMAC/KocRamFinans.git
cd KocRamFinans/BtkAkademiDeneme
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Tanımlayın (`.env` veya `.env.local` oluşturun)
Proje kök dizininde bir `.env` dosyası oluşturup aşağıdaki anahtarları girin:
```env
# Google Gemini API Anahtarı (Zorunlu)
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL Veritabanı Bağlantısı (Zorunlu)
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/veritabani_adi?schema=public"

# Clerk Kimlik Doğrulama (Zorunlu)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Pusher Realtime Chat (İsteğe Bağlı - Mesajlaşma İçin)
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 4. Veritabanı Şemasını PostgreSQL'e Aktarın ve Client Üretin
```bash
npm run db:push
```

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

---

## ⚠️ Yasal Uyarı

Bu platform yalnızca kişisel finans takibi ve bilgilendirme amaçlıdır.  
**Yatırım Tavsiyesi Değildir (YTD).** Yatırım kararlarınızı bir finansal danışmana danışarak alın.
