import * as path from 'path';
import * as vscode from 'vscode';
import { pathExists } from './utils';

export interface WorkbenchEntry {
  workbenchHtmlPath: string;
  checksumKey: string;
}

export interface CursorInstallation {
  ideName: string;
  appRoot: string;
  workbenchDir: string;
  productJsonPath: string;
  entries: WorkbenchEntry[];
}

const ELECTRON_DIRS = ['electron-sandbox', 'electron-browser'] as const;

const CHECKSUM_KEYS: Record<(typeof ELECTRON_DIRS)[number], string> = {
  'electron-sandbox': 'vs/code/electron-sandbox/workbench/workbench.html',
  'electron-browser': 'vs/code/electron-browser/workbench/workbench.html',
};

/**
 * Locate the Cursor install that is hosting this extension host.
 * Cursor chat is part of the Electron workbench DOM; we patch workbench.html there.
 */
export async function findCursorInstallations(): Promise<CursorInstallation[]> {
  const appRoot = vscode.env.appRoot;
  const productJsonPath = path.join(appRoot, 'product.json');
  if (!(await pathExists(productJsonPath))) {
    return [];
  }

  const workbenchDir = path.join(appRoot, 'out', 'vs', 'workbench');
  if (!(await pathExists(workbenchDir))) {
    return [];
  }

  // Prefer Cursor; still allow patching if someone runs a Cursor-compatible host.
  const appName = (vscode.env.appName || '').toLowerCase();
  const ideName = appName.includes('cursor') ? 'Cursor' : vscode.env.appName || 'Unknown IDE';

  const entries: WorkbenchEntry[] = [];
  for (const electronDir of ELECTRON_DIRS) {
    const workbenchHtmlPath = path.join(
      appRoot,
      'out',
      'vs',
      'code',
      electronDir,
      'workbench',
      'workbench.html',
    );
    if (!(await pathExists(workbenchHtmlPath))) {
      continue;
    }
    entries.push({
      workbenchHtmlPath,
      checksumKey: CHECKSUM_KEYS[electronDir],
    });
  }

  if (entries.length === 0) {
    return [];
  }

  return [
    {
      ideName,
      appRoot,
      workbenchDir,
      productJsonPath,
      entries,
    },
  ];
}
