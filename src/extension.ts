import * as vscode from 'vscode';
import type { RtlMode } from './assets';
import { findCursorInstallations } from './finder';
import {
  activatePatch,
  deactivatePatch,
  isFullyInstalled,
  maybeReinjectAfterUpdate,
  readInstalledMode,
  updateModeOnly,
} from './injector';
import { StatusBar } from './statusBar';

const STATE_WAS_ACTIVE = 'persianChatRtl.wasActive';

function configuredMode(): RtlMode {
  const raw = vscode.workspace.getConfiguration('persianChatRtl').get<string>('mode', 'auto');
  if (raw === 'force' || raw === 'off' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

async function refreshStatus(status: StatusBar, context: vscode.ExtensionContext): Promise<void> {
  const installs = await findCursorInstallations();
  if (installs.length === 0) {
    status.update({ installed: false, mode: null, ideOk: false });
    return;
  }
  const inst = installs[0];
  const installed = await isFullyInstalled(inst);
  const mode = installed ? await readInstalledMode(inst) : null;
  await context.globalState.update(STATE_WAS_ACTIVE, installed);
  status.update({ installed, mode, ideOk: true });
}

function restartHint(): string {
  return 'Fully quit Cursor (File → Exit / Quit) and reopen. "Developer: Reload Window" is often not enough because workbench.html is loaded at process start.';
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const status = new StatusBar();
  context.subscriptions.push(status);

  const activateCmd = vscode.commands.registerCommand('persianChatRtl.activate', async () => {
    const installs = await findCursorInstallations();
    if (installs.length === 0) {
      void vscode.window.showErrorMessage(
        'Persian Chat RTL: could not find Cursor workbench files (vscode.env.appRoot). This extension is meant for Cursor IDE.',
      );
      return;
    }
    const mode = configuredMode();
    const result = await activatePatch(installs[0], mode);
    await refreshStatus(status, context);
    const detail = result.messages.join('\n');
    if (result.changed) {
      const pick = await vscode.window.showInformationMessage(
        `Persian Chat RTL activated (mode: ${mode}). ${restartHint()}`,
        'Show details',
      );
      if (pick === 'Show details') {
        const doc = await vscode.workspace.openTextDocument({ content: detail, language: 'markdown' });
        await vscode.window.showTextDocument(doc, { preview: true });
      }
    } else {
      void vscode.window.showWarningMessage(`Persian Chat RTL: no changes.\n${detail}`);
    }
  });

  const deactivateCmd = vscode.commands.registerCommand('persianChatRtl.deactivate', async () => {
    const installs = await findCursorInstallations();
    if (installs.length === 0) {
      void vscode.window.showErrorMessage('Persian Chat RTL: Cursor workbench not found.');
      return;
    }
    const confirm = await vscode.window.showWarningMessage(
      'Remove the Persian Chat RTL patch from Cursor workbench files?',
      { modal: true },
      'Deactivate',
    );
    if (confirm !== 'Deactivate') {
      return;
    }
    const result = await deactivatePatch(installs[0]);
    await context.globalState.update(STATE_WAS_ACTIVE, false);
    await refreshStatus(status, context);
    void vscode.window.showInformationMessage(
      result.changed
        ? `Persian Chat RTL deactivated. ${restartHint()}`
        : `Persian Chat RTL: ${result.messages.join(' | ')}`,
    );
  });

  const statusCmd = vscode.commands.registerCommand('persianChatRtl.status', async () => {
    const installs = await findCursorInstallations();
    if (installs.length === 0) {
      void vscode.window.showInformationMessage(
        'Persian Chat RTL: no Cursor workbench found. App root: ' + vscode.env.appRoot,
      );
      return;
    }
    const inst = installs[0];
    const installed = await isFullyInstalled(inst);
    const mode = installed ? await readInstalledMode(inst) : null;
    const lines = [
      `IDE: ${inst.ideName}`,
      `App root: ${inst.appRoot}`,
      `Installed: ${installed ? 'yes' : 'no'}`,
      `Mode on disk: ${mode ?? '(n/a)'}`,
      `Configured mode: ${configuredMode()}`,
      `Workbench entries: ${inst.entries.length}`,
      ...inst.entries.map((e) => ` - ${e.workbenchHtmlPath}`),
      '',
      'Limitation: Cursor chat is not exposed via official extension APIs; this extension patches workbench.html + ships CSS/JS into the workbench folder.',
    ];
    const doc = await vscode.workspace.openTextDocument({
      content: lines.join('\n'),
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc, { preview: true });
  });

  async function setMode(mode: RtlMode): Promise<void> {
    await vscode.workspace.getConfiguration('persianChatRtl').update('mode', mode, true);
    const installs = await findCursorInstallations();
    if (installs.length === 0) {
      void vscode.window.showErrorMessage('Persian Chat RTL: Cursor workbench not found.');
      return;
    }
    if (!(await isFullyInstalled(installs[0]))) {
      void vscode.window.showWarningMessage(
        `Mode set to ${mode}, but the patch is not installed. Run "Persian Chat RTL: Activate".`,
      );
      return;
    }
    const result = await updateModeOnly(installs[0], mode);
    await refreshStatus(status, context);
    void vscode.window.showInformationMessage(
      result.changed
        ? `Persian Chat RTL mode → ${mode}. ${restartHint()}`
        : result.messages.join(' | '),
    );
  }

  const modeAuto = vscode.commands.registerCommand('persianChatRtl.setModeAuto', () => setMode('auto'));
  const modeForce = vscode.commands.registerCommand('persianChatRtl.setModeForce', () => setMode('force'));
  const modeOff = vscode.commands.registerCommand('persianChatRtl.setModeOff', () => setMode('off'));

  context.subscriptions.push(activateCmd, deactivateCmd, statusCmd, modeAuto, modeForce, modeOff);

  // Startup: refresh UI; optionally re-patch after Cursor updates wiped workbench.html
  await refreshStatus(status, context);
  const autoReactivate = vscode.workspace
    .getConfiguration('persianChatRtl')
    .get<boolean>('autoReactivate', true);
  if (autoReactivate) {
    const installs = await findCursorInstallations();
    if (installs.length > 0) {
      const wasActive = context.globalState.get<boolean>(STATE_WAS_ACTIVE, false);
      const result = await maybeReinjectAfterUpdate(installs[0], configuredMode(), wasActive);
      if (result.changed) {
        await refreshStatus(status, context);
        void vscode.window.showInformationMessage(
          `Persian Chat RTL re-applied after a Cursor update. ${restartHint()}`,
        );
      }
    }
  }
}

export function deactivate(): void {
  // no-op
}
