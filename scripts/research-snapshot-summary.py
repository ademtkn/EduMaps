"""Extract concise public-business evidence from saved research HTML; never prints scripts/cookies."""
import html
import json
import re
import sys
from pathlib import Path
from html.parser import HTMLParser

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
    def handle_data(self, value):
        if not self.skip and value.strip(): self.parts.append(value.strip())

for filename in sys.argv[1:]:
    raw = Path(filename).read_text(errors='replace')
    parser = Text(); parser.feed(raw)
    links = [html.unescape(s) for s in re.findall(r'''href=["']([^"']+)''', raw)]
    images = [html.unescape(s) for s in re.findall(r'''(?:src|data-src|data-lazy-src)=["']([^"']+)''', raw)]
    title = re.search(r'<title[^>]*>(.*?)</title>', raw, re.S)
    canonical = re.search(r'''<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)''', raw)
    print(json.dumps({'file': filename, 'title': title[1] if title else None, 'canonical': canonical[1] if canonical else None,
        'text': ' '.join(parser.parts)[:5500],
        'businessLinks': list(dict.fromkeys(s for s in links if re.search(r'tel:|mailto:|2gis|instagram|facebook', s)))[:25],
        'images': list(dict.fromkeys(s for s in images if 'wp-content/uploads' in s or 'photo' in s or 'gallery' in s))[:35]}, ensure_ascii=False))
