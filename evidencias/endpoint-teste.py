# Endpoint de teste que imita o app da Web do Apps Script (redireciona e responde JSON com CORS).
# Uso: python3 evidencias/endpoint-teste.py <arquivo-de-log>  (escuta em 127.0.0.1:8766)
# /ok aceita o envio; /erro devolve um erro de validação, como o Apps Script faria.
import base64, json, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
LOG = sys.argv[1]
class H(BaseHTTPRequestHandler):
    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        # O Apps Script não responde preflight; o mock também não.
        self.send_response(405); self.end_headers()
    def do_GET(self):
        self._json({'ok': True})
    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        d = json.loads(raw or b'{}')
        arq = d.get('arquivo')
        entry = {'path': self.path, 'contentType': self.headers.get('Content-Type'), 'bytesBody': len(raw),
                 **{k: d.get(k) for k in ('nome', 'whatsapp', 'cidade', 'conta', 'site')},
                 'arquivo': None if not arq else {'nome': arq['nome'], 'tipo': arq['tipo'], 'bytes': len(base64.b64decode(arq['base64']))}}
        with open(LOG, 'a') as f: f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        if self.path == '/erro':
            return self._json({'ok': False, 'erro': 'Informe um WhatsApp válido, com DDD.'})
        # Como o Apps Script: 302 para outra URL que entrega a resposta
        self.send_response(302)
        self.send_header('Location', '/resposta')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    def log_message(self, *a): pass
ThreadingHTTPServer(('127.0.0.1', 8766), H).serve_forever()
