# Cursor Chat Persian RTL

**English** | [فارسی](#فارسی)

Auto-detects **Persian (Farsi)**, **Arabic**, and **Hebrew** text in Cursor’s chat / composer / agent panels and applies **right-to-left** layout to those messages and the input box — without forcing the whole IDE UI to RTL. Code blocks stay left-to-right.

> **Why an installable extension that “patches” Cursor?**  
> Cursor’s chat UI is a proprietary workbench surface. There is **no official VS Code extension API** to theme or set `dir` on those bubbles. Working community fixes inject CSS/JS into Cursor’s `workbench.html`. This extension packages that approach: Activate writes the assets and links them; Deactivate restores backups.

---

## Install in Cursor (from VSIX)

1. Download the `.vsix` from this repo’s **GitHub Releases** (preferred), or build locally with `npm run package`.
2. Open **Cursor**.
3. Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Extensions: Install from VSIX…**
4. Choose `cursor-chat-persian-rtl-1.0.0.vsix`.
5. Command Palette → **Persian Chat RTL: Activate (auto-detect)**.
6. **Fully quit Cursor** (File → Exit / Quit) and reopen.  
   *Reload Window is often not enough* — `workbench.html` is read at process start.
7. Open Chat / Agent and type Persian. Bubbles and the input should flip to RTL when RTL scripts are present.

### Deactivate

**Persian Chat RTL: Deactivate** → full quit → reopen.

### Modes

| Command | Behavior |
|--------|----------|
| Mode — Auto-detect (default) | Only bubbles/inputs that contain Persian/Arabic/Hebrew become RTL |
| Mode — Force RTL | Chat text surfaces always RTL (code still LTR) |
| Mode — Off | Patch files remain linked but the script does nothing |

Settings: `persianChatRtl.mode`, `persianChatRtl.autoReactivate`.

---

## Build from source

```bash
cd cursor-chat-persian-rtl
npm install
npm run package
# → cursor-chat-persian-rtl-1.0.0.vsix
```

---

## How it works (technical)

1. Uses `vscode.env.appRoot` to find the Cursor install.
2. Writes `persian-chat-rtl.css` and `persian-chat-rtl.js` into `out/vs/workbench/`.
3. Injects `<link>` + `<script>` into `out/vs/code/electron-sandbox|browser/workbench/workbench.html` (with `.persian-chat-rtl.bak` backups).
4. Removes the matching keys under `product.json` → `checksums` so Cursor does not reject the modified HTML.
5. Injected JS uses a `MutationObserver` + RTL Unicode ranges to set `dir="rtl"` / `data-persian-rtl` on message and input nodes; code/monaco/menus are excluded.

### Known limitations

- **Not an official Cursor API** — Cursor updates may overwrite `workbench.html`; re-run Activate (or rely on auto-reactivate) and fully restart.
- **Write permission** — Installing into the app folder may need Administrator / elevated Cursor once on Windows/macOS locked installs.
- **Selector drift** — If Cursor renames chat DOM classes, auto-detect may miss some nodes until selectors are updated.
- **Does not change VS Code Copilot Chat** by design (targets Cursor workbench). Other editors’ AI panels may need different injectors.
- Cannot be verified end-to-end inside a headless cloud VM that does not run the Cursor GUI; packaging and TypeScript build are verified.

---

## فارسی

این افزونه متن **فارسی / عربی / عبری** را در چت و Composer کرسر تشخیص می‌دهد و جهت نمایش را **راست‌به‌چپ** می‌کند؛ بلوک‌های کد LTR می‌مانند.

### نصب روی Cursor از VSIX

1. فایل `.vsix` را بگیرید.
2. Cursor را باز کنید.
3. پالت فرمان → **Extensions: Install from VSIX…**
4. فایل `cursor-chat-persian-rtl-1.0.0.vsix` را انتخاب کنید.
5. پالت فرمان → **Persian Chat RTL: Activate (auto-detect)**
6. Cursor را **کاملاً ببندید** و دوباره باز کنید (Reload Window معمولاً کافی نیست).
7. در چت فارسی بنویسید؛ حباب پیام و کادر ورودی باید RTL شوند.

### غیرفعال‌سازی

**Persian Chat RTL: Deactivate** → خروج کامل → باز کردن مجدد.

### نکته مهم

رابط چت Cursor از API رسمی افزونه VS Code قابل استایل‌دهی کامل نیست؛ این افزونه با تزریق CSS/JS به `workbench.html` کار می‌کند (با پشتیبان‌گیری). بعد از به‌روزرسانی Cursor ممکن است دوباره Activate لازم باشد.
