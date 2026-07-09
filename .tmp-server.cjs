// 简单的 Node HTTP server，监听 18082
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = 'E:\\多agent牛马';
const PORT = 18082;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/') u = '/animal-emotions-v3.html';
  const p = path.join(ROOT, u);
  const ext = path.extname(p).toLowerCase();
  const type = types[ext] || 'application/octet-stream';
  fs.readFile(p, (err, data) => {
    if (err) {
      r.statusCode = 404;
      r.end('not found: ' + p);
      return;
    }
    r.setHeader('Content-Type', type);
    r.setHeader('Cache-Control', 'no-store');
    r.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('listening on http://127.0.0.1:' + PORT);
});
