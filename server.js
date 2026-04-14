#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8835;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html',
  '.svg':  'image/svg+xml',
  '.css':  'text/css',
  '.js':   'application/javascript',
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html'
               : req.url === '/favicon.svg' ? '/docs/icon.svg'
               : req.url;

  const abs = path.join(DIR, filePath);
  const ext = path.extname(abs);

  fs.readFile(abs, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dancing Monkey server running on port ${PORT}`);

  // Build proxy URL
  const proxyTemplate = process.env.VSCODE_PROXY_URI || `http://127.0.0.1:{{port}}/`;
  const url = proxyTemplate.replace('{{port}}', PORT);
  console.log(`App URL: ${url}`);

  // Open Hydrogen webview tab
  const iconB64 = fs.readFileSync(path.join(DIR, 'docs/icon.svg')).toString('base64');
  const iconUrl = `data:image/svg+xml;base64,${iconB64}`;

  try {
    // Get focused panel id
    const tabs = JSON.parse(execSync('adom-cli hydrogen workspace tabs 2>/dev/null').toString());
    const panelId = tabs.tabs[0]?.panelId;
    if (panelId) {
      execSync(`adom-cli hydrogen workspace add-tab \
        --panel-id "${panelId}" \
        --panel-type "adom/a1b2c3d4-0031-4000-a000-000000000031" \
        --display-name "Dancing Monkey" \
        --display-icon "${iconUrl}" \
        --initial-state '${JSON.stringify({ url })}' 2>/dev/null`);
      console.log('Opened Hydrogen tab: Dancing Monkey');
    }
  } catch (e) {
    console.log('Could not open Hydrogen tab:', e.message);
  }
});
