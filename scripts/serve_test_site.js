const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || process.env.PORT || 4173);
const rootDir = path.resolve(process.argv[3] || '_site');

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.pdf', 'application/pdf'],
  ['.mp3', 'audio/mpeg'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function safeResolve(urlPathname) {
  const decoded = decodeURIComponent(urlPathname.split('?')[0]);
  const normalized = decoded.replace(/^\/+/, '');
  let candidate = path.join(rootDir, normalized);

  if (decoded.endsWith('/')) {
    candidate = path.join(rootDir, normalized, 'index.html');
  } else if (!path.extname(candidate)) {
    const directoryIndex = path.join(rootDir, normalized, 'index.html');
    const htmlFile = `${candidate}.html`;
    if (fs.existsSync(directoryIndex)) {
      candidate = directoryIndex;
    } else if (fs.existsSync(htmlFile)) {
      candidate = htmlFile;
    }
  }

  const resolved = path.resolve(candidate);
  return resolved.startsWith(rootDir) ? resolved : null;
}

const server = http.createServer((req, res) => {
  const filePath = safeResolve(req.url || '/');
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.promises
    .stat(filePath)
    .then((stats) => {
      const finalPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
      return fs.promises.readFile(finalPath).then((buffer) => ({ finalPath, buffer }));
    })
    .then(({ finalPath, buffer }) => {
      const type = contentTypes.get(path.extname(finalPath).toLowerCase()) || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-store'
      });
      res.end(buffer);
    })
    .catch(() => {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static test server running at http://127.0.0.1:${port} from ${rootDir}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
