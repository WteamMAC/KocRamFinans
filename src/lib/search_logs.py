import os
import json

logs_dir = r"C:\Users\Cemalklc\.gemini\antigravity\brain"
for root, dirs, files in os.walk(logs_dir):
    for f in files:
        if f.endswith("overview.txt"):
            p = os.path.join(root, f)
            try:
                with open(p, "r", encoding="utf-8") as file:
                    content = file.read()
                    # Each line is a JSON object
                    for line in content.splitlines():
                        if not line.strip(): continue
                        try:
                            obj = json.loads(line)
                            if obj.get("type") == "USER_INPUT" and obj.get("source") == "USER_EXPLICIT":
                                request_text = obj.get("content", "")
                                if "bes" in request_text.lower() or "katkı" in request_text.lower():
                                    print(f"--- USER REQUEST IN {os.path.basename(os.path.dirname(os.path.dirname(p)))} ---")
                                    print(request_text)
                                    print("=" * 40)
                        except:
                            pass
            except Exception as e:
                pass
