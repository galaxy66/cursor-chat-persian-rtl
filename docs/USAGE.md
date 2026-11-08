# راهنمای استفاده — Cursor Chat Persian RTL

**فارسی (اصلی)** · [English](#english-usage-guide)

افزونهٔ **Cursor Chat Persian RTL** متن فارسی (و عربی / عبری) را در چت، Composer و Agent تشخیص می‌دهد و جهت نمایش را **راست‌به‌چپ (RTL)** می‌کند؛ بلوک‌های کد چپ‌به‌راست (LTR) می‌مانند.

نسخهٔ فعلی: **v1.0.0**  
ریپو: https://github.com/galaxy66/cursor-chat-persian-rtl  
دانلود VSIX: https://github.com/galaxy66/cursor-chat-persian-rtl/releases/tag/v1.0.0

---

## ۱) دانلود VSIX از Release

1. به صفحهٔ انتشار بروید:  
   [Releases → v1.0.0](https://github.com/galaxy66/cursor-chat-persian-rtl/releases/tag/v1.0.0)
2. در بخش **Assets** فایل زیر را دانلود کنید:  
   `cursor-chat-persian-rtl-1.0.0.vsix`

> اگر فایل را خودتان می‌سازید: در پوشهٔ پروژه `npm install` و سپس `npm run package`.

---

## ۲) نصب در Cursor (Install from VSIX)

1. **Cursor** را باز کنید.
2. پالت فرمان را باز کنید:  
   - ویندوز / لینوکس: `Ctrl+Shift+P`  
   - مک: `Cmd+Shift+P`
3. دستور **`Extensions: Install from VSIX…`** را اجرا کنید.
4. فایل `cursor-chat-persian-rtl-1.0.0.vsix` را انتخاب کنید.
5. صبر کنید تا نصب تمام شود (در لیست Extensions ظاهر می‌شود).

---

## ۳) فعال‌سازی (Activate — auto-detect)

1. پالت فرمان (`Ctrl/Cmd+Shift+P`).
2. دستور **`Persian Chat RTL: Activate (auto-detect)`** را اجرا کنید.
3. اگر دسترسی نوشتن روی پوشهٔ نصب Cursor لازم باشد، یک‌بار Cursor را با دسترسی مدیر اجرا کنید و دوباره Activate بزنید (بخش عیب‌یابی را ببینید).
4. پیام موفقیت را بخوانید — سپس **حتماً Cursor را کاملاً ببندید و دوباره باز کنید**.

### چرا Reload Window کافی نیست؟

افزونه فایل `workbench.html` کرسر را پچ می‌کند. این فایل معمولاً فقط هنگام **شروع پروسه** خوانده می‌شود.  
`Developer: Reload Window` اغلب کافی نیست. از **File → Exit / Quit** استفاده کنید و Cursor را دوباره باز کنید.

---

## ۴) بعد از باز شدن Cursor چه کار کنید؟

1. پنل **Chat** یا **Agent** را باز کنید.
2. یک پیام فارسی بنویسید یا از مدل بخواهید فارسی جواب بدهد.
3. حباب پیام و کادر ورودی باید **راست‌چین / RTL** شوند.
4. بلوک‌های کد، ترمینال داخل پاسخ، و منوها باید **LTR** بمانند.

در نوار وضعیت (Status Bar) معمولاً چیزی شبیه `Chat RTL auto` دیده می‌شود. کلیک روی آن وضعیت را نشان می‌دهد.

---

## ۵) تشخیص خودکار (Auto-detect) چطور کار می‌کند؟

حالت پیش‌فرض **`auto`** است:

- اگر متن حباب یا ورودی شامل حروف **فارسی / عربی / عبری** باشد → `dir=rtl` اعمال می‌شود.
- اگر متن فقط انگلیسی/لاتین باشد → RTL اجباری نمی‌شود.
- کد (`pre` / `code` / Monaco و مشابه) همیشه LTR می‌ماند.
- هنگام تایپ و هنگام استریم پاسخ مدل، اسکریپت با `MutationObserver` دوباره اسکن می‌کند.

حالت‌های دیگر:

| حالت | رفتار |
|------|--------|
| **Auto-detect** (پیش‌فرض) | فقط محتوای دارای اسکریپت RTL |
| **Force RTL** | سطوح متن چت همیشه RTL (کد همچنان LTR) |
| **Off** | پچ روی دیسک می‌ماند ولی اثر RTL خاموش است |

تنظیمات Cursor:

- `persianChatRtl.mode` → `auto` | `force` | `off`
- `persianChatRtl.autoReactivate` → بعد از آپدیت Cursor در صورت پاک‌شدن پچ، تلاش برای تزریق مجدد (پیش‌فرض: روشن)

---

## ۶) فهرست دستورات (Command Palette)

| دستور | کار |
|--------|-----|
| **Persian Chat RTL: Activate (auto-detect)** | نوشتن CSS/JS و لینک‌کردن در `workbench.html` |
| **Persian Chat RTL: Deactivate** | بازگردانی بکاپ / حذف تگ‌ها و فایل‌های تزریق‌شده |
| **Persian Chat RTL: Check Status** | مسیر نصب، نصب‌بودن پچ، و mode روی دیسک |
| **Persian Chat RTL: Mode — Auto-detect** | mode = auto |
| **Persian Chat RTL: Mode — Force RTL** | mode = force |
| **Persian Chat RTL: Mode — Off** | mode = off (پچ می‌ماند، اثر خاموش) |

بعد از **Activate / Deactivate / تغییر Mode** معمولاً یک **خروج کامل و باز کردن مجدد** لازم است.

### غیرفعال‌سازی کامل

1. `Persian Chat RTL: Deactivate`
2. خروج کامل از Cursor و باز کردن مجدد

---

## ۷) بعد از به‌روزرسانی Cursor چه کنید؟

آپدیت Cursor اغلب فایل‌های workbench را جایگزین می‌کند و پچ را پاک می‌کند.

1. Cursor را باز کنید.
2. اگر `persianChatRtl.autoReactivate` روشن باشد، افزونه ممکن است خودش پچ را برگرداند و پیام بدهد — باز هم **خروج کامل و باز کردن** را انجام دهید.
3. اگر RTL کار نکرد:  
   `Persian Chat RTL: Check Status` → اگر Installed نیست → دوباره **Activate** → خروج کامل / باز کردن.

---

## ۸) عیب‌یابی

### الف) خطای دسترسی نوشتن / Permission denied

پچ باید داخل پوشهٔ نصب Cursor نوشته شود. روی بعضی نصب‌های قفل‌شده (ویندوز Program Files، مک Applications) یک‌بار نیاز به دسترسی مدیر است:

- **ویندوز:** یک‌بار Cursor را «Run as administrator» کنید → Activate → خارج شوید → بعداً عادی باز کنید.
- **مک / لینوکس:** مالکیت/مجوز نوشتن روی پوشهٔ app، یا یک‌بار با دسترسی کافی Activate کنید.

سپس Status را چک کنید که Installed = yes باشد.

### ب) پچ پاک شده (بعد از آپدیت یا نصب مجدد Cursor)

علائم: فارسی هنوز چپ‌چین است؛ Status می‌گوید نصب نیست.

راه‌حل: **Activate** دوباره + خروج کامل + باز کردن. autoReactivate را روشن نگه دارید.

### ج) بعضی پیام‌ها RTL نمی‌شوند (selector drift)

Cursor گاهی کلاس‌های DOM چت را عوض می‌کند. اسکریپت روی انتخابگرهای رایج Anysphere/composer کار می‌کند؛ اگر UI عوض شود ممکن است بعضی حباب‌ها از قلم بیفتند.

راه‌حل موقت: Mode را روی **Force RTL** بگذارید و restart کنید.  
راه‌حل پایدار: issue در ریپو باز کنید یا انتخابگرها را به‌روز کنید.

### د) Reload کردم ولی اثری نبود

خروج کامل (Quit) و باز کردن مجدد — نه فقط Reload Window.

### ه) VS Code یا Copilot Chat عوض نشد

عمداً فقط **Cursor workbench** هدف است؛ چت Copilot در VS Code جداست.

---

## ۹) محدودیت مهم (صادقانه)

Cursor API رسمی برای استایل‌دادن به حباب‌های چت خود ندارد. این افزونه با **تزریق CSS/JS به workbench** کار می‌کند (با بکاپ). این روش جامعهٔ RTL برای Cursor است و نسبت به آپدیت‌های Cursor شکننده است — Activate مجدد بعد از آپدیت طبیعی است.

---

# English usage guide

**Persian Chat RTL** auto-detects Persian / Arabic / Hebrew in Cursor Chat, Composer, and Agent, applies RTL to those bubbles and the input, and keeps code blocks LTR.

- Repo: https://github.com/galaxy66/cursor-chat-persian-rtl  
- VSIX: https://github.com/galaxy66/cursor-chat-persian-rtl/releases/tag/v1.0.0 → asset `cursor-chat-persian-rtl-1.0.0.vsix`

## Quick start

1. Download the `.vsix` from **Release v1.0.0** Assets.
2. Cursor → Command Palette → **Extensions: Install from VSIX…** → pick the file.
3. Command Palette → **Persian Chat RTL: Activate (auto-detect)**.
4. **Fully quit** Cursor (File → Exit / Quit) and reopen. Reload Window is often not enough.
5. Open Chat/Agent and type Persian — bubbles + input should go RTL; code stays LTR.

## Auto-detect

Default mode `auto`: only nodes whose text contains Persian/Arabic/Hebrew Unicode ranges get `dir=rtl`. Streaming replies and typing are watched via `MutationObserver`. Code / Monaco / menus stay LTR.

Other modes (Command Palette or setting `persianChatRtl.mode`):

- **Force RTL** — chat text surfaces always RTL  
- **Off** — patch remains linked but the script is inert  

## Commands

| Command | Purpose |
|---------|---------|
| Activate (auto-detect) | Patch `workbench.html` + write CSS/JS |
| Deactivate | Restore backups / strip injection |
| Check Status | App root, installed?, mode on disk |
| Mode — Auto / Force / Off | Rewrite injected assets for that mode |

After Activate, Deactivate, or mode changes: **full quit + reopen**.

## After a Cursor update

Updates often wipe `workbench.html`. With `persianChatRtl.autoReactivate` (default on), the extension may re-inject on startup — still fully restart. If RTL is gone: **Check Status** → **Activate** → quit/reopen.

## Troubleshooting

| Problem | What to do |
|---------|------------|
| Permission denied writing workbench | Run Cursor elevated once → Activate → quit; then use normally |
| Patch wiped after update | Activate again + full restart; keep autoReactivate on |
| Some bubbles stay LTR | Try Mode → Force RTL; report selector drift on the repo |
| Reload did nothing | Quit the app entirely, don’t only Reload Window |
| VS Code Copilot unchanged | Out of scope — Cursor workbench only |

## Limitation

There is no official extension API to theme Cursor’s proprietary chat UI. This extension injects into the workbench (documented community approach). Expect to re-Activate after some Cursor upgrades.
