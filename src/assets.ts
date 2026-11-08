/**
 * Files written into Cursor's workbench directory and linked from workbench.html.
 * Official VS Code extension APIs cannot style Cursor's proprietary chat UI, so
 * the only reliable approach today is a documented workbench HTML/CSS/JS inject.
 */

export type RtlMode = 'auto' | 'force' | 'off';

export const HTML_MARKER = '<!-- persian-chat-rtl -->';
export const CSS_FILENAME = 'persian-chat-rtl.css';
export const JS_FILENAME = 'persian-chat-rtl.js';
export const MODE_MARKER_PREFIX = '/* persian-chat-rtl-mode:';

export function buildCss(mode: RtlMode): string {
  return `${MODE_MARKER_PREFIX} ${mode} */
/*
 * Persian Chat RTL — baseline CSS.
 * Auto mode relies mostly on JS (per-bubble detection).
 * Force mode leans on these selectors.
 * Code / monaco / menus stay LTR in all modes.
 */

/* Prefer browser paragraph-level bidi when we do not force direction */
.persian-chat-rtl-auto .markdown-root p,
.persian-chat-rtl-auto .anysphere-markdown-container-root p,
.persian-chat-rtl-auto .markdown-section p,
.persian-chat-rtl-auto [data-message-kind] p {
  unicode-bidi: plaintext;
  text-align: start;
}

/* Elements marked by the injector script */
[data-persian-rtl="1"] {
  direction: rtl !important;
  text-align: right !important;
  unicode-bidi: isolate !important;
}

[data-persian-rtl="1"] ul,
[data-persian-rtl="1"] ol {
  padding-right: 1.25em !important;
  padding-left: 0 !important;
}

/* Force mode: chat text surfaces */
.persian-chat-rtl-force .markdown-root,
.persian-chat-rtl-force .anysphere-markdown-container-root,
.persian-chat-rtl-force .markdown-section,
.persian-chat-rtl-force .composer-message-group,
.persian-chat-rtl-force [data-message-kind="assistant"] .markdown-root,
.persian-chat-rtl-force .composer-human-message,
.persian-chat-rtl-force .composer-human-message-container,
.persian-chat-rtl-force .aislash-editor-input,
.persian-chat-rtl-force .aislash-editor-input-readonly,
.persian-chat-rtl-force .ui-prompt-input,
.persian-chat-rtl-force .ui-prompt-input .ProseMirror {
  direction: rtl !important;
  text-align: right !important;
}

.persian-chat-rtl-force .aislash-editor-placeholder,
.persian-chat-rtl-force [data-placeholder] {
  direction: rtl !important;
  text-align: right !important;
}

/* Always keep code, editors, and chrome LTR */
.markdown-root pre,
.markdown-root code,
.anysphere-markdown-container-root pre,
.anysphere-markdown-container-root code,
.markdown-section pre,
.markdown-section code,
.markdown-code-outer-container,
.cursor-code-block-content,
.composer-code-block-content,
.composer-message-codeblock,
.ui-code-block,
.ui-default-code,
.monaco-editor,
.monaco-menu,
.ui-model-picker__trigger,
.ui-dropdown-menu,
[data-streamdown="code-block"],
[data-streamdown="code-block-body"],
[data-persian-rtl="1"] pre,
[data-persian-rtl="1"] code {
  direction: ltr !important;
  text-align: left !important;
  unicode-bidi: plaintext !important;
}
`;
}

export function buildJs(mode: RtlMode): string {
  // Minify-friendly single IIFE; no build step for the injected asset.
  return `/*! persian-chat-rtl mode=${mode} */
(function () {
  if (window.__persianChatRtlLoaded) return;
  window.__persianChatRtlLoaded = true;

  var MODE = ${JSON.stringify(mode)};
  var STYLE_CLASS_AUTO = 'persian-chat-rtl-auto';
  var STYLE_CLASS_FORCE = 'persian-chat-rtl-force';
  var ATTR = 'data-persian-rtl';
  var RTL_RE = /[\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFF]/;
  var CODE_SEL = 'pre,code,.ui-code-block,.monaco-editor,.markdown-code-outer-container,.cursor-code-block-content,.composer-code-block-content,.composer-message-codeblock,.ui-default-code,[data-streamdown="code-block"],[data-streamdown="code-block-body"]';
  var SKIP_SEL = '.monaco-menu,.ui-model-picker__trigger,.ui-dropdown-menu,.monaco-editor';
  var BUBBLE_SEL = [
    '.markdown-root',
    '.anysphere-markdown-container-root',
    '.markdown-section',
    '.composer-human-message',
    '.composer-human-message-container',
    '.human-message-with-todos-wrapper',
    '[data-message-kind]',
    '.composer-ai-message',
    '.ui-user-message',
    '.ui-assistant-message'
  ].join(',');
  var INPUT_SEL = [
    '.aislash-editor-input',
    '.aislash-editor-input-readonly',
    '.ui-prompt-input',
    '.ui-prompt-input .ProseMirror',
    '[contenteditable="true"]'
  ].join(',');
  var CHAT_ROOT_SEL = [
    '.ui-conversation-viewer',
    '.ui-turn-view',
    '.ui-agent-tray',
    '.composer-pane',
    '[class*="composer-"]',
    '.aichat',
    '[class*="chat"]'
  ].join(',');

  function setBodyMode() {
    var b = document.body;
    if (!b) return;
    b.classList.remove(STYLE_CLASS_AUTO, STYLE_CLASS_FORCE);
    if (MODE === 'auto') b.classList.add(STYLE_CLASS_AUTO);
    if (MODE === 'force') b.classList.add(STYLE_CLASS_FORCE);
  }

  function isCode(el) {
    return !!(el && el.matches && (el.matches(CODE_SEL) || el.closest(CODE_SEL)));
  }

  function isSkipped(el) {
    return !!(el && el.closest && el.closest(SKIP_SEL));
  }

  function textOf(el) {
    if (!el) return '';
    try {
      var clone = el.cloneNode(true);
      if (clone.querySelectorAll) {
        clone.querySelectorAll(CODE_SEL).forEach(function (n) { n.remove(); });
      }
      return (clone.textContent || '').trim();
    } catch (e) {
      return (el.textContent || '').trim();
    }
  }

  function hasRtl(text) {
    return RTL_RE.test(text || '');
  }

  function mark(el, on) {
    if (!el || el.nodeType !== 1 || isCode(el) || isSkipped(el)) return;
    if (on) {
      el.setAttribute(ATTR, '1');
      el.setAttribute('dir', 'rtl');
      el.style.setProperty('direction', 'rtl', 'important');
      el.style.setProperty('text-align', 'right', 'important');
      el.style.setProperty('unicode-bidi', 'isolate', 'important');
    } else if (el.getAttribute(ATTR) === '1') {
      el.removeAttribute(ATTR);
      el.removeAttribute('dir');
      el.style.removeProperty('direction');
      el.style.removeProperty('text-align');
      el.style.removeProperty('unicode-bidi');
    }
  }

  function processBubble(el) {
    if (!el || el.nodeType !== 1 || isCode(el) || isSkipped(el)) return;
    if (MODE === 'off') {
      mark(el, false);
      return;
    }
    if (MODE === 'force') {
      mark(el, true);
      return;
    }
    // auto
    mark(el, hasRtl(textOf(el)));
  }

  function processInput(el) {
    if (!el || el.nodeType !== 1 || isSkipped(el)) return;
    // Only touch chat/composer inputs, not every contenteditable in the IDE
    var inChat = !!(el.closest && el.closest(CHAT_ROOT_SEL + ',.composer-bar,.prompt-input-wrapper,[class*="composer"],[class*="aichat"],[class*="Agent"]'));
    if (!inChat && !(el.matches && el.matches('.aislash-editor-input,.ui-prompt-input,.ui-prompt-input *'))) {
      return;
    }
    if (MODE === 'off') {
      mark(el, false);
      return;
    }
    if (MODE === 'force') {
      mark(el, true);
      return;
    }
    var value = textOf(el);
    mark(el, hasRtl(value));
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    try {
      scope.querySelectorAll(BUBBLE_SEL).forEach(processBubble);
      scope.querySelectorAll(INPUT_SEL).forEach(processInput);
    } catch (e) { /* ignore */ }
  }

  function onInputEvent(ev) {
    var t = ev.target;
    if (!t || t.nodeType !== 1) return;
    var editable = t.closest ? t.closest(INPUT_SEL) : null;
    if (editable) processInput(editable);
  }

  function boot() {
    setBodyMode();
    if (MODE === 'off') return;
    scan(document);

    if (document.body) {
      var obs = new MutationObserver(function (mutations) {
        var needsFull = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'characterData') {
            var p = m.target && m.target.parentElement;
            if (p) {
              var bubble = p.closest && p.closest(BUBBLE_SEL);
              if (bubble) processBubble(bubble);
              var input = p.closest && p.closest(INPUT_SEL);
              if (input) processInput(input);
            }
            continue;
          }
          m.addedNodes && m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(BUBBLE_SEL)) processBubble(node);
            if (node.querySelectorAll) {
              node.querySelectorAll(BUBBLE_SEL).forEach(processBubble);
              node.querySelectorAll(INPUT_SEL).forEach(processInput);
            }
            needsFull = true;
          });
        }
        if (needsFull) scan(document);
      });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    document.addEventListener('input', onInputEvent, true);
    document.addEventListener('keyup', onInputEvent, true);

    var ticks = 0;
    var timer = setInterval(function () {
      scan(document);
      if (++ticks >= 60) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`;
}

export function parseModeFromCss(css: string): RtlMode | null {
  const m = css.match(/\/\* persian-chat-rtl-mode:\s*(auto|force|off)\s*\*\//);
  return m ? (m[1] as RtlMode) : null;
}
