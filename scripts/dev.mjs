import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve('.');
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/demo/index.html' : pathname));
    if (!file.startsWith(root + sep)) throw new Error('Invalid path');
    const body = await readFile(file);
    response.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' })[extname(file)] || 'application/octet-stream');
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(4173, '127.0.0.1', () => console.log('Demo: http://127.0.0.1:4173'));
