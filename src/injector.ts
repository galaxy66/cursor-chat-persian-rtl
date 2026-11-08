import * as fs from 'fs/promises';
import * as path from 'path';
import {
  CSS_FILENAME,
  HTML_MARKER,
  JS_FILENAME,
  RtlMode,
  buildCss,
  buildJs,
  parseModeFromCss,
} from './assets';
import type { CursorInstallation, WorkbenchEntry } from './finder';
import { isWritable, pathExists } from './utils';

const CSS_HREF = `../../../workbench/${CSS_FILENAME}`;
const JS_SRC = `../../../workbench/${JS_FILENAME}`;

export interface PatchResult {
  messages: string[];
  changed: boolean;
}

function linkSnippet(): string {
  return `\n\t\t${HTML_MARKER}\n\t\t<link rel="stylesheet" type="text/css" href="${CSS_HREF}">`;
}

function scriptSnippet(): string {
  return `\n\t\t${HTML_MARKER}\n\t\t<script src="${JS_SRC}"></script>\n`;
}

async function htmlHasMarker(htmlPath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    return content.includes(HTML_MARKER);
  } catch {
    return false;
  }
}

export async function isFullyInstalled(installation: CursorInstallation): Promise<boolean> {
  if (installation.entries.length === 0) {
    return false;
  }
  for (const e of installation.entries) {
    if (!(await htmlHasMarker(e.workbenchHtmlPath))) {
      return false;
    }
  }
  return true;
}

export async function readInstalledMode(installation: CursorInstallation): Promise<RtlMode | null> {
  const cssPath = path.join(installation.workbenchDir, CSS_FILENAME);
  try {
    const css = await fs.readFile(cssPath, 'utf-8');
    return parseModeFromCss(css);
  } catch {
    return null;
  }
}

async function removeChecksum(
  installation: CursorInstallation,
  checksumKey: string,
  messages: string[],
): Promise<void> {
  try {
    const content = await fs.readFile(installation.productJsonPath, 'utf-8');
    const product = JSON.parse(content) as { checksums?: Record<string, string> };
    if (!product.checksums || !product.checksums[checksumKey]) {
      messages.push(`product.json: checksum already absent (${checksumKey})`);
      return;
    }
    const backupPath = installation.productJsonPath + '.persian-chat-rtl.bak';
    if (!(await pathExists(backupPath))) {
      await fs.copyFile(installation.productJsonPath, backupPath);
      messages.push('product.json: backup created');
    }
    delete product.checksums[checksumKey];
    await fs.writeFile(installation.productJsonPath, JSON.stringify(product, null, '\t') + '\n', 'utf-8');
    messages.push(`product.json: removed checksum for ${checksumKey}`);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      messages.push(`product.json: permission denied (${installation.productJsonPath})`);
    } else {
      messages.push(`product.json: ${err.message}`);
    }
  }
}

async function restoreProductJson(installation: CursorInstallation, messages: string[]): Promise<void> {
  const backupPath = installation.productJsonPath + '.persian-chat-rtl.bak';
  if (!(await pathExists(backupPath))) {
    return;
  }
  try {
    await fs.copyFile(backupPath, installation.productJsonPath);
    await fs.unlink(backupPath);
    messages.push('product.json: restored from backup');
  } catch (e) {
    messages.push(`product.json restore failed: ${(e as Error).message}`);
  }
}

async function writeAssets(
  installation: CursorInstallation,
  mode: RtlMode,
  messages: string[],
): Promise<void> {
  const cssPath = path.join(installation.workbenchDir, CSS_FILENAME);
  const jsPath = path.join(installation.workbenchDir, JS_FILENAME);
  await fs.writeFile(cssPath, buildCss(mode), 'utf-8');
  await fs.writeFile(jsPath, buildJs(mode), 'utf-8');
  messages.push(`Wrote ${CSS_FILENAME} + ${JS_FILENAME} (mode=${mode})`);
}

async function injectHtml(
  entry: WorkbenchEntry,
  installation: CursorInstallation,
  messages: string[],
): Promise<boolean> {
  try {
    const backupPath = entry.workbenchHtmlPath + '.persian-chat-rtl.bak';
    await fs.copyFile(entry.workbenchHtmlPath, backupPath);

    let html = await fs.readFile(entry.workbenchHtmlPath, 'utf-8');
    if (html.includes(HTML_MARKER)) {
      messages.push(`workbench.html already patched (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
      await removeChecksum(installation, entry.checksumKey, messages);
      return false;
    }

    const cssLinkPattern = /<link[^>]*workbench\.desktop\.main\.css[^>]*>/i;
    const cssLinkMatch = html.match(cssLinkPattern);
    if (cssLinkMatch && cssLinkMatch.index !== undefined) {
      const insertPos = cssLinkMatch.index + cssLinkMatch[0].length;
      html = html.slice(0, insertPos) + linkSnippet() + html.slice(insertPos);
    } else {
      const headClose = html.toLowerCase().indexOf('</head>');
      if (headClose === -1) {
        messages.push(`No insertion point in ${entry.workbenchHtmlPath}`);
        return false;
      }
      html = html.slice(0, headClose) + linkSnippet() + '\n' + html.slice(headClose);
    }

    const htmlClose = html.toLowerCase().lastIndexOf('</html>');
    if (htmlClose !== -1) {
      html = html.slice(0, htmlClose) + scriptSnippet() + html.slice(htmlClose);
    } else {
      html += scriptSnippet();
    }

    await fs.writeFile(entry.workbenchHtmlPath, html, 'utf-8');
    messages.push(`Injected tags into workbench.html (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
    await removeChecksum(installation, entry.checksumKey, messages);
    return true;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      messages.push(`Permission denied writing ${entry.workbenchHtmlPath}`);
      messages.push('Run Cursor once with elevated privileges (Administrator / sudo) to apply the patch.');
    } else {
      messages.push(`Inject error: ${err.message}`);
    }
    return false;
  }
}

async function stripOrRestoreHtml(entry: WorkbenchEntry, messages: string[]): Promise<boolean> {
  const backupPath = entry.workbenchHtmlPath + '.persian-chat-rtl.bak';
  if (await pathExists(backupPath)) {
    try {
      await fs.copyFile(backupPath, entry.workbenchHtmlPath);
      await fs.unlink(backupPath);
      messages.push(`Restored workbench.html from backup (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
      return true;
    } catch (e) {
      messages.push(`Backup restore failed: ${(e as Error).message}`);
    }
  }

  try {
    let html = await fs.readFile(entry.workbenchHtmlPath, 'utf-8');
    html = html.replace(
      new RegExp(`\\n?\\t*${escapeRegExp(HTML_MARKER)}\\n?\\t*<link[^>]*${escapeRegExp(CSS_FILENAME)}[^>]*>`, 'g'),
      '',
    );
    html = html.replace(
      new RegExp(
        `\\n?\\t*${escapeRegExp(HTML_MARKER)}\\n?\\t*<script[^>]*${escapeRegExp(JS_FILENAME)}[^>]*><\\/script>\\n?`,
        'g',
      ),
      '',
    );
    await fs.writeFile(entry.workbenchHtmlPath, html, 'utf-8');
    messages.push(`Stripped RTL tags from workbench.html (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
    return true;
  } catch (e) {
    messages.push(`Strip failed: ${(e as Error).message}`);
    return false;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function activatePatch(
  installation: CursorInstallation,
  mode: RtlMode,
): Promise<PatchResult> {
  const messages: string[] = [];
  let changed = false;

  if (!(await isWritable(installation.workbenchDir))) {
    messages.push(`Not writable: ${installation.workbenchDir}`);
    messages.push('Run Cursor as Administrator / with write access to the app folder, then Activate again.');
    return { messages, changed: false };
  }

  try {
    await writeAssets(installation, mode, messages);
    changed = true;
  } catch (e) {
    messages.push(`Failed writing assets: ${(e as Error).message}`);
    return { messages, changed: false };
  }

  for (const entry of installation.entries) {
    const ok = await injectHtml(entry, installation, messages);
    if (ok) {
      changed = true;
    }
  }

  return { messages, changed };
}

export async function updateModeOnly(
  installation: CursorInstallation,
  mode: RtlMode,
): Promise<PatchResult> {
  const messages: string[] = [];
  if (!(await isFullyInstalled(installation))) {
    messages.push('Patch is not installed. Run "Persian Chat RTL: Activate" first.');
    return { messages, changed: false };
  }
  if (!(await isWritable(installation.workbenchDir))) {
    messages.push(`Not writable: ${installation.workbenchDir}`);
    return { messages, changed: false };
  }
  try {
    const current = await readInstalledMode(installation);
    if (current === mode) {
      messages.push(`Mode already ${mode}`);
      return { messages, changed: false };
    }
    await writeAssets(installation, mode, messages);
    return { messages, changed: true };
  } catch (e) {
    messages.push(`Mode update failed: ${(e as Error).message}`);
    return { messages, changed: false };
  }
}

export async function deactivatePatch(installation: CursorInstallation): Promise<PatchResult> {
  const messages: string[] = [];
  let changed = false;

  if (!(await isWritable(installation.workbenchDir))) {
    messages.push(`Not writable: ${installation.workbenchDir}`);
    return { messages, changed: false };
  }

  const anyMarker = (
    await Promise.all(installation.entries.map((e) => htmlHasMarker(e.workbenchHtmlPath)))
  ).some(Boolean);

  if (!anyMarker) {
    messages.push('RTL patch is not installed.');
    return { messages, changed: false };
  }

  for (const entry of installation.entries) {
    if (await htmlHasMarker(entry.workbenchHtmlPath)) {
      if (await stripOrRestoreHtml(entry, messages)) {
        changed = true;
      }
    }
  }

  await restoreProductJson(installation, messages);

  for (const name of [CSS_FILENAME, JS_FILENAME]) {
    const p = path.join(installation.workbenchDir, name);
    if (await pathExists(p)) {
      try {
        await fs.unlink(p);
        messages.push(`Deleted ${name}`);
        changed = true;
      } catch (e) {
        messages.push(`Could not delete ${name}: ${(e as Error).message}`);
      }
    }
  }

  return { messages, changed };
}

export async function maybeReinjectAfterUpdate(
  installation: CursorInstallation,
  mode: RtlMode,
  wasActive: boolean,
): Promise<PatchResult> {
  if (!wasActive) {
    return { messages: [], changed: false };
  }
  if (await isFullyInstalled(installation)) {
    // Keep assets in sync with configured mode
    return updateModeOnly(installation, mode);
  }
  return activatePatch(installation, mode);
}
