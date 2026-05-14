/* eslint-disable @typescript-eslint/no-explicit-any */
import { NewsClient, NewsItem } from "@/components/dashboard/news-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function determineTag(title: string, description: string): string {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("kripto") || text.includes("bitcoin") || text.includes("btc") || text.includes("ethereum") || text.includes("binance") || text.includes("coin") || text.includes("crypto")) {
        return "Kripto";
    }
    if (text.includes("bist") || text.includes("borsa istanbul") || text.includes("spk") || text.includes("hisse") || text.includes("endeks") || text.includes("koç") || text.includes("sabancı")) {
        return "BIST";
    }
    if (text.includes("nasdaq") || text.includes("s&p") || text.includes("dow jones") || text.includes("fed") || text.includes("abd borsası") || text.includes("wall street") || text.includes("faiz kararı") || text.includes("küresel") || text.includes("global") || text.includes("us stocks") || text.includes("markets") || text.includes("treasury") || text.includes("interest rate") || text.includes("fomc")) {
        return "Küresel / ABD";
    }
    if (text.includes("altın") || text.includes("gram") || text.includes("ons") || text.includes("gümüş") || text.includes("petrol") || text.includes("emtia") || text.includes("brent") || text.includes("gold") || text.includes("silver") || text.includes("oil") || text.includes("commodity")) {
        return "Emtia / Altın";
    }
    if (text.includes("dolar") || text.includes("euro") || text.includes("tcmb") || text.includes("faiz") || text.includes("enflasyon") || text.includes("döviz") || text.includes("kur") || text.includes("merkez bankası") || text.includes("ekonomi") || text.includes("dollar") || text.includes("inflation") || text.includes("currency") || text.includes("central bank") || text.includes("economy") || text.includes("cpi")) {
        return "Döviz / Makro";
    }
    return "Genel Ekonomi";
}

const SOURCES = [
    { name: "NTV", url: "https://www.ntv.com.tr/ekonomi.rss" },
    { name: "TRT Haber", url: "https://www.trthaber.com/ekonomi_articles.rss" },
    { name: "Habertürk", url: "https://www.haberturk.com/rss/ekonomi.xml" },
    { name: "Bloomberg HT", url: "https://www.bloomberght.com/rss" },
    { name: "Investing.com TR", url: "https://tr.investing.com/rss/news_285.rss" },
    { name: "Dünya Gazetesi", url: "https://www.dunya.com/rss" },
    { name: "CNBC-e", url: "https://www.cnbce.com/rss" },
    { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
    { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
    { name: "CNBC Global", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664" },
    { name: "Investing.com", url: "https://www.investing.com/rss/news_285.rss" },
    { name: "CoinTelegraph", url: "https://cointelegraph.com/rss" }
];

async function fetchFeed(source: { name: string, url: string }): Promise<NewsItem[]> {
    try {
        // Cache bypass to fetch latest instantly
        const res = await fetch(source.url, { 
            cache: "no-store",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*"
            }
        });
        const xml = await res.text();
        
        if (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<channel')) {
             throw new Error(`Geçersiz RSS formatı: HTTP ${res.status}`);
        }

        const items: NewsItem[] = [];
        const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
        let match;

        const extractTag = (xmlStr: string, tag: string, altTag?: string) => {
            let regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
            let m = xmlStr.match(regex);
            if (!m && altTag) {
                regex = new RegExp(`<${altTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${altTag}>`, 'i');
                m = xmlStr.match(regex);
            }
            return m ? m[1].trim() : '';
        };

        const extractLink = (xmlStr: string) => {
            let m = xmlStr.match(/<link[^>]*href="([^"]+)"/i);
            if (m) return m[1].trim();
            m = xmlStr.match(/<link[^>]*>(?:<!\\[CDATA\\[)?([^<]+)(?:\\]\\]>)?<\/link>/i);
            return m ? m[1].trim() : '';
        };

        const extractImage = (xmlStr: string) => {
            const encMatch = xmlStr.match(/<enclosure[^>]*url="([^"]*)"/i);
            if (encMatch) return encMatch[1];
            const mediaMatch = xmlStr.match(/<media:content[^>]*url="([^"]*)"/i);
            if (mediaMatch) return mediaMatch[1];
            const descImgMatch = xmlStr.match(/<img[^>]*src="([^"]*)"/i);
            if (descImgMatch) return descImgMatch[1];
            return null;
        };

        while ((match = itemRegex.exec(xml)) !== null && items.length < 50) {
            const itemXml = match[1];
            const title = extractTag(itemXml, 'title');
            const link = extractLink(itemXml);
            let pubDate = extractTag(itemXml, 'pubDate', 'published');
            const rawDesc = extractTag(itemXml, 'description', 'summary');
            
            let description = rawDesc.replace(/<[^>]+>/g, '').trim();
            if (description.length > 120) {
                description = description.substring(0, 120) + "...";
            }
            
            const imageUrl = extractImage(itemXml);
            const tag = determineTag(title, rawDesc.replace(/<[^>]+>/g, ''));
            let timestamp = Date.now();

            if (pubDate) {
                const dateObj = new Date(pubDate);
                if (!isNaN(dateObj.getTime())) {
                    timestamp = dateObj.getTime();
                    pubDate = dateObj.toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) + " - " + dateObj.toLocaleDateString("tr-TR");
                }
            }

            if (title && link && !title.includes("Haber başlığı bulunamadı")) {
                items.push({ title, link, pubDate, description, imageUrl, tag, source: source.name, timestamp });
            }
        }
        return items;
    } catch (err: any) {
        console.error(`${source.name} beslemesi çekilemedi:`, err);
        // HATA AYIKLAMA İÇİN: Ekrana hatayı haber olarak basalım
        return [{
            title: `HATA: ${source.name} çekilemedi`,
            link: "#",
            pubDate: new Date().toLocaleTimeString(),
            description: `Sistem hatası: ${err.message || err.toString()}`,
            imageUrl: null,
            tag: "Genel Ekonomi",
            source: source.name,
            timestamp: Date.now()
        }];
    }
}

/**
 * Birden çok kaynaktan canlı haber çeken fonksiyon
 */
async function getEconomicNews(): Promise<NewsItem[]> {
    const allFeeds = await Promise.all(SOURCES.map(source => fetchFeed(source)));
    let allNews = allFeeds.flat();
    
    // Sort by descending timestamp (newest first)
    allNews.sort((a, b) => (b as any).timestamp - (a as any).timestamp);
    
    // Return max 300 items so we don't overload the client but have plenty of news
    return allNews.slice(0, 300);
}

export default async function NewsPage() {
    const news = await getEconomicNews();
    return <NewsClient initialNews={news} />;
}