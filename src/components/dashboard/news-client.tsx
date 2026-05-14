"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Newspaper, Clock, ArrowUpRight, TrendingUp, AlertCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    imageUrl: string | null;
    tag: string;
}

interface NewsClientProps {
    initialNews: NewsItem[];
}

const TAG_COLORS: Record<string, string> = {
    "Kripto": "text-orange-500 bg-orange-500/10 border-orange-500/20",
    "BIST": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    "Küresel / ABD": "text-blue-500 bg-blue-500/10 border-blue-500/20",
    "Emtia / Altın": "text-amber-500 bg-amber-500/10 border-amber-500/20",
    "Döviz / Makro": "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    "Genel Ekonomi": "text-slate-500 bg-slate-500/10 border-slate-500/20"
};

const ALL_TAGS = ["Tümü", "Kripto", "BIST", "Küresel / ABD", "Emtia / Altın", "Döviz / Makro", "Genel Ekonomi"];

export function NewsClient({ initialNews }: NewsClientProps) {
    const [selectedTag, setSelectedTag] = useState("Tümü");

    const filteredNews = selectedTag === "Tümü" 
        ? initialNews 
        : initialNews.filter(item => item.tag === selectedTag);

    return (
        <div className="space-y-8 p-6 md:p-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-primary flex items-center gap-3">
                        <Newspaper className="h-8 w-8" /> Canlı Ekonomi Haberleri
                    </h2>
                    <p className="text-muted-foreground mt-1">Piyasalardaki en güncel gelişmeleri anlık olarak takip edin ve filtrelenmiş olarak görün.</p>
                </div>
            </div>

            {/* Filters */}
            {initialNews.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pb-2">
                    <div className="flex items-center gap-2 mr-2 text-muted-foreground font-medium text-sm">
                        <Filter className="h-4 w-4" /> Filtrele:
                    </div>
                    {ALL_TAGS.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border",
                                selectedTag === tag
                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                    : "bg-card text-muted-foreground border-border/40 hover:bg-muted hover:border-primary/30"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {initialNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[32px] border border-border/30 shadow-ambient-low text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                    <h3 className="text-lg font-bold text-primary">Haberler Yüklenemedi</h3>
                    <p className="text-muted-foreground opacity-70 mt-2">Şu anda haber kaynağına ulaşılamıyor. Lütfen daha sonra tekrar deneyin.</p>
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-card rounded-[32px] border border-border/30 shadow-ambient-low text-center">
                    <Filter className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
                    <h3 className="text-lg font-bold text-primary">Sonuç Bulunamadı</h3>
                    <p className="text-muted-foreground opacity-70 mt-2">Seçtiğiniz kategoriye (<b>{selectedTag}</b>) ait güncel haber bulunmamaktadır.</p>
                    <button onClick={() => setSelectedTag("Tümü")} className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold text-sm hover:bg-primary/20 transition-colors">
                        Tüm Haberleri Göster
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNews.map((item, idx) => (
                        <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="group h-full flex">
                            <Card className="flex flex-col w-full overflow-hidden bg-card border-border/30 shadow-ambient-low hover:shadow-ambient-medium hover:border-primary/40 transition-all duration-300 rounded-[24px]">
                                {item.imageUrl && (
                                    <div className="w-full h-48 overflow-hidden bg-muted relative">
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm shadow-sm", TAG_COLORS[item.tag] || TAG_COLORS["Genel Ekonomi"])}>
                                                {item.tag}
                                            </span>
                                        </div>
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-1 relative">
                                    {/* If no image, show tag here instead */}
                                    {!item.imageUrl && (
                                        <div className="mb-3">
                                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border shadow-sm", TAG_COLORS[item.tag] || TAG_COLORS["Genel Ekonomi"])}>
                                                {item.tag}
                                            </span>
                                        </div>
                                    )}
                                    <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-3 mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm opacity-80 line-clamp-2 flex-1">{item.description}</p>

                                    <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground font-medium opacity-60">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.pubDate}</span>
                                        <span className="flex items-center gap-1 group-hover:text-primary transition-colors">Habere Git <ArrowUpRight className="h-3 w-3" /></span>
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
