/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Newspaper, Clock, ArrowUpRight, TrendingUp, AlertCircle } from "lucide-react";


/**
 * İnternetten canlı haber çeken fonksiyon (NTV Ekonomi RSS üzerinden)
 * Next.js sunucu tarafında çalışır ve dış paket (rss-parser vb.) gerektirmez.
 */
async function getEconomicNews() {
    try {
        // Haberleri her 5 dakikada bir yeniden doğrula (revalidate)
        const res = await fetch("https://www.ntv.com.tr/ekonomi.rss", {
            next: { revalidate: 300 }
        });
        const xml = await res.text();

        const items: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        // XML içinden belirli etiketleri güvenli çıkarmak için Regex fonksiyonu
        const extractTag = (xmlStr: string, tag: string) => {
            const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 'is');
            const m = xmlStr.match(regex);
            return m ? m[1].trim() : '';
        };

        // Görselleri ayıklamak için
        const extractImage = (xmlStr: string) => {
            const encMatch = xmlStr.match(/<enclosure[^>]*url="(.*?)"/is);
            if (encMatch) return encMatch[1];
            const mediaMatch = xmlStr.match(/<media:content[^>]*url="(.*?)"/is);
            if (mediaMatch) return mediaMatch[1];
            const descImgMatch = xmlStr.match(/<img[^>]*src="(.*?)"/is);
            if (descImgMatch) return descImgMatch[1];
            return null;
        };

        // Sadece en güncel 12 haberi alıyoruz
        while ((match = itemRegex.exec(xml)) !== null && items.length < 12) {
            const itemXml = match[1];
            const title = extractTag(itemXml, 'title');
            const link = extractTag(itemXml, 'link');
            let pubDate = extractTag(itemXml, 'pubDate');
            const rawDesc = extractTag(itemXml, 'description');
            const description = rawDesc.replace(/<[^>]+>/g, '').substring(0, 120) + "...";
            const imageUrl = extractImage(itemXml);

            if (pubDate) {
                pubDate = new Date(pubDate).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date(pubDate).toLocaleDateString("tr-TR");
            }

            if (title && link) {
                items.push({ title, link, pubDate, description, imageUrl });
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

    return (
        <div className="space-y-8 p-6 md:p-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-[#8c5000] flex items-center gap-3">
                        <Newspaper className="h-8 w-8" /> Canlı Ekonomi Haberleri
                    </h2>
                    <p className="text-[#554336] mt-1">Piyasalardaki en güncel gelişmeleri anlık olarak takip edin.</p>
                </div>
            </div>

            {news.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-[#dbc2b0]/30 shadow-ambient-low text-center">
                    <AlertCircle className="h-12 w-12 text-[#554336] opacity-30 mb-4" />
                    <h3 className="text-lg font-bold text-[#8c5000]">Haberler Yüklenemedi</h3>
                    <p className="text-[#554336] opacity-70 mt-2">Şu anda haber kaynağına ulaşılamıyor. Lütfen daha sonra tekrar deneyin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, idx) => (
                        <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="group h-full flex">
                            <Card className="flex flex-col w-full overflow-hidden bg-white border-[#dbc2b0]/30 shadow-ambient-low hover:shadow-ambient-medium hover:border-[#8c5000]/40 transition-all duration-300 rounded-[24px]">
                                {item.imageUrl && (
                                    <div className="w-full h-48 overflow-hidden bg-[#f8f9fa] relative">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-[#8c5000] text-xs font-bold uppercase tracking-wider mb-3">
                                        <TrendingUp className="h-4 w-4" /> Piyasa
                                    </div>
                                    <h3 className="font-heading font-bold text-lg text-[#191c1d] group-hover:text-[#8c5000] transition-colors line-clamp-3 mb-2">{item.title}</h3>
                                    <p className="text-[#554336] text-sm opacity-80 line-clamp-2 flex-1">{item.description}</p>

                                    <div className="mt-6 pt-4 border-t border-[#dbc2b0]/20 flex items-center justify-between text-xs text-[#554336] font-medium opacity-60">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.pubDate}</span>
                                        <span className="flex items-center gap-1 group-hover:text-[#8c5000] transition-colors">Habere Git <ArrowUpRight className="h-3 w-3" /></span>
                                    </div>
                                </div>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}