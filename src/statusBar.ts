import * as vscode from 'vscode';
import type { RtlMode } from './assets';

export class StatusBar {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    this.item.command = 'persianChatRtl.status';
    this.item.tooltip = 'Persian Chat RTL status';
    this.item.show();
  }

  update(opts: { installed: boolean; mode: RtlMode | null; ideOk: boolean }): void {
    if (!opts.ideOk) {
      this.item.text = '$(circle-slash) Chat RTL N/A';
      this.item.tooltip = 'Cursor workbench not found — this extension targets Cursor IDE.';
      return;
    }
    if (!opts.installed) {
      this.item.text = '$(sync-ignored) Chat RTL Off';
      this.item.tooltip = 'Persian Chat RTL is not patched into the workbench. Run Activate.';
      return;
    }
    const mode = opts.mode ?? 'auto';
    this.item.text = `$(arrow-both) Chat RTL ${mode}`;
    this.item.tooltip = `Persian Chat RTL active (mode: ${mode}). Full quit & reopen Cursor after Activate/mode changes.`;
  }

  dispose(): void {
    this.item.dispose();
  }
}
