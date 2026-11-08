# Cursor Chat Persian RTL

**[راهنمای کامل استفاده (فارسی)](docs/USAGE.md)** · **[Full usage guide (English)](docs/USAGE.md#english-usage-guide)**

Auto-detects **Persian (Farsi)**, **Arabic**, and **Hebrew** in Cursor’s chat / composer / agent panels and applies **RTL** to those messages and the input — without forcing the whole IDE UI to RTL. Code blocks stay LTR.

> **Why patch Cursor?** There is no official VS Code extension API to set `dir` on Cursor’s proprietary chat bubbles. This extension injects CSS/JS into `workbench.html` (with backups). See [docs/USAGE.md](docs/USAGE.md) for install, commands, updates, and troubleshooting.

---

## Quick install

1. Download `cursor-chat-persian-rtl-1.0.0.vsix` from  
   [Release v1.0.0](https://github.com/galaxy66/cursor-chat-persian-rtl/releases/tag/v1.0.0).
2. **Install**
   - **Windows:** some Cursor builds hide **Extensions: Install from VSIX…** — use PowerShell:

     ```powershell
     & "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe" --install-extension "PATH\to\cursor-chat-persian-rtl-1.0.0.vsix"
     ```

   - Or, if available: Command Palette → **Extensions: Install from VSIX…**
3. **Persian Chat RTL: Activate (auto-detect)**
4. **Fully quit** Cursor and reopen (Reload Window is often not enough).
5. Type Persian in Chat / Agent — bubbles + input should go RTL.

جزئیات، دستورات، و عیب‌یابی → **[docs/USAGE.md](docs/USAGE.md)**

---

## Commands (summary)

| Command | Purpose |
|---------|---------|
| Activate (auto-detect) | Patch workbench + enable RTL |
| Deactivate | Restore backups / remove injection |
| Check Status | Installed? mode? paths? |
| Mode — Auto / Force / Off | Change RTL behavior |

Settings: `persianChatRtl.mode`, `persianChatRtl.autoReactivate`.

---

## Build from source

```bash
npm install
npm run package
# → cursor-chat-persian-rtl-1.0.0.vsix
```

---

## How it works (technical)

1. Finds Cursor via `vscode.env.appRoot`.
2. Writes `persian-chat-rtl.css` / `.js` into `out/vs/workbench/`.
3. Injects `<link>` + `<script>` into `workbench.html` (sandbox/browser variants) with `.persian-chat-rtl.bak` backups.
4. Clears matching `product.json` checksums so Cursor accepts the HTML.
5. Injected JS auto-detects RTL Unicode ranges on bubbles/inputs; code stays LTR.

### Known limitations

- Cursor updates may wipe the patch — re-Activate (or auto-reactivate) + full restart.
- Writing the app folder may need Administrator once.
- Chat DOM class renames can miss some bubbles until selectors are updated.
- Targets Cursor workbench only (not VS Code Copilot Chat).

---

## فارسی (خلاصه)

1. از [Release v1.0.0](https://github.com/galaxy66/cursor-chat-persian-rtl/releases/tag/v1.0.0) فایل `.vsix` را بگیرید.
2. نصب روی ویندوز (اگر Install from VSIX نبود):

   ```powershell
   & "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe" --install-extension "PATH\to\cursor-chat-persian-rtl-1.0.0.vsix"
   ```

3. **Activate (auto-detect)** → Cursor را **کاملاً ببندید** و دوباره باز کنید.
4. راهنمای کامل: **[docs/USAGE.md](docs/USAGE.md)**
