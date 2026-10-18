import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.gz':'application/gzip','.wasm':'application/wasm','.md':'text/plain; charset=utf-8'};
const port = Number(process.env.PORT || 5173);
createServer(async (req,res) => {
  try {
    let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // A second prefix exercises project-repository GitHub Pages paths locally.
    if(path.startsWith('/fc-tracker/')) path=path.slice('/fc-tracker'.length);
    if(path.endsWith('/')) path+='index.html';
    const target=resolve(root,'.'+path);
    if(!target.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
  } catch {res.writeHead(404);res.end('Archivo no encontrado');}
}).listen(port,'127.0.0.1',()=>console.log(`FC Tracker: http://127.0.0.1:${port}`));
