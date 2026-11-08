/**
 * Offline smoke test: simulate workbench.html + product.json patch/unpatch
 * without a real Cursor install.
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Build first so dist exists; we re-implement minimal checks against source assets
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'persian-rtl-smoke-'));
  const appRoot = path.join(tmp, 'resources', 'app');
  const workbenchDir = path.join(appRoot, 'out', 'vs', 'workbench');
  const htmlDir = path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench');
  await fs.mkdir(workbenchDir, { recursive: true });
  await fs.mkdir(htmlDir, { recursive: true });

  const htmlPath = path.join(htmlDir, 'workbench.html');
  const productPath = path.join(appRoot, 'product.json');

  await fs.writeFile(
    htmlPath,
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="../../../workbench/workbench.desktop.main.css">
</head>
<body>
  <div class="markdown-root"><p>سلام دنیا</p><pre><code>const x = 1;</code></pre></div>
</body>
</html>
`,
    'utf-8',
  );

  await fs.writeFile(
    productPath,
    JSON.stringify(
      {
        nameShort: 'Cursor',
        checksums: {
          'vs/code/electron-sandbox/workbench/workbench.html': 'deadbeef',
          'other': 'keep-me',
        },
      },
      null,
      '\t',
    ) + '\n',
    'utf-8',
  );

  // Dynamic import of compiled injector is awkward (vscode external). Test assets + HTML ops inline.
  const assetsPath = path.join(root, 'src', 'assets.ts');
  const assetsSrc = await fs.readFile(assetsPath, 'utf-8');
  if (!assetsSrc.includes("RtlMode = 'auto' | 'force' | 'off'")) {
    throw new Error('assets.ts missing RtlMode');
  }

  // Mimic injector snippets
  const HTML_MARKER = '<!-- persian-chat-rtl -->';
  const CSS_FILENAME = 'persian-chat-rtl.css';
  const JS_FILENAME = 'persian-chat-rtl.js';
  const CSS_HREF = `../../../workbench/${CSS_FILENAME}`;
  const JS_SRC = `../../../workbench/${JS_FILENAME}`;

  let html = await fs.readFile(htmlPath, 'utf-8');
  const cssLinkPattern = /<link[^>]*workbench\.desktop\.main\.css[^>]*>/i;
  const m = html.match(cssLinkPattern);
  if (!m || m.index === undefined) throw new Error('css link not found');
  const insertPos = m.index + m[0].length;
  const linkSnippet = `\n\t\t${HTML_MARKER}\n\t\t<link rel="stylesheet" type="text/css" href="${CSS_HREF}">`;
  html = html.slice(0, insertPos) + linkSnippet + html.slice(insertPos);
  const htmlClose = html.toLowerCase().lastIndexOf('</html>');
  const scriptSnippet = `\n\t\t${HTML_MARKER}\n\t\t<script src="${JS_SRC}"></script>\n`;
  html = html.slice(0, htmlClose) + scriptSnippet + html.slice(htmlClose);
  await fs.writeFile(htmlPath, html, 'utf-8');

  await fs.writeFile(path.join(workbenchDir, CSS_FILENAME), '/* persian-chat-rtl-mode: auto */\n', 'utf-8');
  await fs.writeFile(path.join(workbenchDir, JS_FILENAME), 'window.__persianChatRtlLoaded=true;', 'utf-8');

  const product = JSON.parse(await fs.readFile(productPath, 'utf-8'));
  delete product.checksums['vs/code/electron-sandbox/workbench/workbench.html'];
  await fs.writeFile(productPath, JSON.stringify(product, null, '\t') + '\n', 'utf-8');

  const patched = await fs.readFile(htmlPath, 'utf-8');
  if (!patched.includes(HTML_MARKER)) throw new Error('marker missing');
  if (!patched.includes(CSS_FILENAME)) throw new Error('css link missing');
  if (!patched.includes(JS_FILENAME)) throw new Error('script missing');

  const product2 = JSON.parse(await fs.readFile(productPath, 'utf-8'));
  if (product2.checksums['vs/code/electron-sandbox/workbench/workbench.html']) {
    throw new Error('checksum not removed');
  }
  if (product2.checksums.other !== 'keep-me') throw new Error('unrelated checksum removed');

  // Strip
  let stripped = patched;
  stripped = stripped.replace(
    new RegExp(`\\n?\\t*${HTML_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?\\t*<link[^>]*${CSS_FILENAME}[^>]*>`, 'g'),
    '',
  );
  stripped = stripped.replace(
    new RegExp(
      `\\n?\\t*${HTML_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?\\t*<script[^>]*${JS_FILENAME}[^>]*><\\/script>\\n?`,
      'g',
    ),
    '',
  );
  if (stripped.includes(HTML_MARKER)) throw new Error('strip failed');

  // RTL regex sanity
  const RTL_RE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
  if (!RTL_RE.test('سلام')) throw new Error('Persian not detected');
  if (!RTL_RE.test('עברית')) throw new Error('Hebrew not detected');
  if (!RTL_RE.test('العربية')) throw new Error('Arabic not detected');
  if (RTL_RE.test('hello world')) throw new Error('false positive on Latin');

  console.log('smoke-inject OK');
  console.log('tmp:', tmp);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
