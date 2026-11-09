import http.server
import socketserver
import webbrowser
import os

# Her zaman serve.py dosyasının bulunduğu klasörü (gglab-website) sun
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

PORT = 4173

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Tarayıcının HTML, CSS ve JS dosyalarını önbelleğe (cache) almasını engeller
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"Sunucu başlatıldı: {url}")
    print(f"Sunulan klasör: {BASE_DIR}")
    print("Durdurmak için Ctrl+C tuşlarına basabilirsiniz.")
    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu durduruldu.")
