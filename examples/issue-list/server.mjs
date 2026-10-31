// Tiny static server for the example: serves public/ and the issues as JSON.
//   node server.mjs            http://localhost:4310
//   PORT=5000 node server.mjs

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 4310);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file =
    pathname === '/api/issues'
      ? join(root, 'data/issues.json')
      : join(root, 'public', normalize(pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': `${types[extname(file)] ?? 'application/octet-stream'}; charset=utf-8` });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`issue-list on http://localhost:${port}`));
