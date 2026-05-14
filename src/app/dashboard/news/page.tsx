/* eslint-disable @typescript-eslint/no-explicit-any */
import { NewsClient, NewsItem } from "@/components/dashboard/news-client";

export const dynamic = "force-dynamic";

function determineTag(title: string, description: string): string {
    const text = (title + " " + description).toLowerCase();
    
    if (text.includes("kripto") || text.includes("bitcoin") || text.includes("btc") || text.includes("ethereum") || text.includes("binance") || text.includes("coin")) {
        return "Kripto";
    }
    if (text.includes("bist") || text.includes("borsa istanbul") || text.includes("spk") || text.includes("hisse") || text.includes("endeks") || text.includes("koç") || text.includes("sabancı")) {
        return "BIST";
    }
    if (text.includes("nasdaq") || text.includes("s&p") || text.includes("dow jones") || text.includes("fed") || text.includes("abd borsası") || text.includes("wall street") || text.includes("faiz kararı")) {
        return "Küresel / ABD";
    }
    if (text.includes("altın") || text.includes("gram") || text.includes("ons") || text.includes("gümüş") || text.includes("petrol") || text.includes("emtia") || text.includes("brent")) {
        return "Emtia / Altın";
    }
    if (text.includes("dolar") || text.includes("euro") || text.includes("tcmb") || text.includes("faiz") || text.includes("enflasyon") || text.includes("döviz") || text.includes("kur") || text.includes("merkez bankası")) {
        return "Döviz / Makro";
    }
    return "Genel Ekonomi";
}

/**
 * İnternetten canlı haber çeken fonksiyon (NTV Ekonomi RSS üzerinden)
 * Next.js sunucu tarafında çalışır ve dış paket (rss-parser vb.) gerektirmez.
 */
async function getEconomicNews(): Promise<NewsItem[]> {
    try {
        // Haberleri her 5 dakikada bir yeniden doğrula (revalidate)
        const res = await fetch("https://www.ntv.com.tr/ekonomi.rss", {
            next: { revalidate: 300 }
        });
        const xml = await res.text();

        const items: NewsItem[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        // XML içinden belirli etiketleri güvenli çıkarmak için Regex fonksiyonu
        const extractTag = (xmlStr: string, tag: string) => {
            const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
            const m = xmlStr.match(regex);
            return m ? m[1].trim() : '';
        };

        // Görselleri ayıklamak için
        const extractImage = (xmlStr: string) => {
            const encMatch = xmlStr.match(/<enclosure[^>]*url="([^"]*)"/i);
            if (encMatch) return encMatch[1];
            const mediaMatch = xmlStr.match(/<media:content[^>]*url="([^"]*)"/i);
            if (mediaMatch) return mediaMatch[1];
            const descImgMatch = xmlStr.match(/<img[^>]*src="([^"]*)"/i);
            if (descImgMatch) return descImgMatch[1];
            return null;
        };

        // Daha fazla haber çekip (örn. 30) filtrelemede içerik zenginliği sağlayalım
        while ((match = itemRegex.exec(xml)) !== null && items.length < 30) {
            const itemXml = match[1];
            const title = extractTag(itemXml, 'title');
            const link = extractTag(itemXml, 'link');
            let pubDate = extractTag(itemXml, 'pubDate');
            const rawDesc = extractTag(itemXml, 'description');
            const description = rawDesc.replace(/<[^>]+>/g, '').substring(0, 120) + "...";
            const imageUrl = extractImage(itemXml);
            
            const tag = determineTag(title, rawDesc.replace(/<[^>]+>/g, ''));

            if (pubDate) {
                pubDate = new Date(pubDate).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date(pubDate).toLocaleDateString("tr-TR");
            }

            if (title && link) {
                items.push({ title, link, pubDate, description, imageUrl, tag });
            }
        }
        return items;
    } catch (err) {
        console.error("Haberleri çekerken hata oluştu:", err);
        return [];
    }
}

export default async function NewsPage() {
    const news = await getEconomicNews();
    return <NewsClient initialNews={news} />;
}