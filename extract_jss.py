import json
import sys
import re

def extract_jss(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'<script type="application/json" id="__JSS_STATE__">(.*?)</script>', content, re.DOTALL)
    if match:
        return match.group(1)
    return None

if __name__ == "__main__":
    jss_str = extract_jss(sys.argv[1])
    if jss_str:
        try:
            # Clean up the JSON if needed (some characters might be escaped in script tags)
            print(jss_str)
        except Exception as e:
            print(f"Error parsing JSON: {e}", file=sys.stderr)
    else:
        print("JSS state not found", file=sys.stderr)
