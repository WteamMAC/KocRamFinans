import fs from 'fs';

async function fetchFeed(source) {
    try {
        const res = await fetch(source.url, { 
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const xml = await res.text();
        const items = [];
        const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
        let match;

        const extractTag = (xmlStr, tag, altTag) => {
            let regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
            let m = xmlStr.match(regex);
            if (!m && altTag) {
                regex = new RegExp(`<${altTag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${altTag}>`, 'i');
                m = xmlStr.match(regex);
            }
            return m ? m[1].trim() : '';
        };

        const extractLink = (xmlStr) => {
            let m = xmlStr.match(/<link[^>]*href="([^"]+)"/i);
            if (m) return m[1].trim();
            m = xmlStr.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
            return m ? m[1].trim() : '';
        };

        let firstMatch = null;

        while ((match = itemRegex.exec(xml)) !== null && items.length < 50) {
            const itemXml = match[1];
            if(!firstMatch) firstMatch = itemXml;

            const title = extractTag(itemXml, 'title');
            const link = extractLink(itemXml);
            if (title && link) items.push(title);
        }

        if (items.length === 0 && firstMatch) {
             console.log(`Failed for ${source.name}. Sample item:\n`, firstMatch.substring(0, 300));
             console.log('Title extracted:', extractTag(firstMatch, 'title'));
             console.log('Link extracted:', extractLink(firstMatch));
        }

        return items;
    } catch(e) { return [e.message]; }
}

const SOURCES = [
    { name: 'NTV', url: 'https://www.ntv.com.tr/ekonomi.rss' },
    { name: 'TRT Haber', url: 'https://www.trthaber.com/ekonomi_articles.rss' },
    { name: 'Habertürk', url: 'https://www.haberturk.com/rss/ekonomi.xml' },
    { name: 'Bloomberg HT', url: 'https://www.bloomberght.com/rss' },
    { name: 'Investing.com TR', url: 'https://tr.investing.com/rss/news_285.rss' },
    { name: 'Dünya Gazetesi', url: 'https://www.dunya.com/rss' },
    { name: 'CNBC-e', url: 'https://www.cnbce.com/rss' },
    { name: 'BBC Türkçe', url: 'https://feeds.bbci.co.uk/turkce/rss.xml' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
    { name: 'CNBC Global', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
    { name: 'Investing.com', url: 'https://www.investing.com/rss/news_285.rss' },
    { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' }
];

async function run() {
    for (let s of SOURCES) {
        const items = await fetchFeed(s);
        console.log(s.name, items.length);
    }
}
run();
