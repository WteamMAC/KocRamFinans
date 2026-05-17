from tefas import Crawler
import datetime
import sys
import json

def fetch_latest_price(symbol):
    crawler = Crawler()
    today = datetime.date.today()
    
    # Try last 5 days (to skip weekends, holidays)
    for i in range(5):
        query_date = today - datetime.timedelta(days=i)
        date_str = query_date.strftime("%Y-%m-%d")
        try:
            df = crawler.fetch(start=date_str, end=date_str, name=symbol)
            if not df.empty:
                row = df.iloc[0]
                return {
                    "symbol": symbol,
                    "price": float(row["price"]),
                    "title": str(row["title"]),
                    "date": date_str,
                    "success": True
                }
        except Exception as e:
            # Continue looking back
            pass
            
    return {
        "symbol": symbol,
        "success": False,
        "error": "No price found in the last 5 days"
    }

def main():
    symbols = sys.argv[1:] if len(sys.argv) > 1 else []
    if not symbols:
        print(json.dumps({}, ensure_ascii=False))
        return
        
    results = {}
    for sym in symbols:
        clean_sym = sym.strip().upper()
        if clean_sym:
            results[clean_sym] = fetch_latest_price(clean_sym)
            
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
