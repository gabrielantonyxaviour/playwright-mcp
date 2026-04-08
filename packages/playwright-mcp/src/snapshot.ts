import type { Page } from "playwright";
import type { Session } from "./session-manager.js";

/**
 * DOM walker that runs inside the browser page context.
 * Returns a structured tree of visible elements with roles and names.
 * Interactive elements get data-pw-ref attributes for later targeting.
 */
const DOM_WALKER_SCRIPT = `(() => {
  let refCounter = 1;

  const INTERACTIVE_TAGS = new Set([
    'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'DETAILS', 'SUMMARY'
  ]);

  const INTERACTIVE_ROLES = new Set([
    'button', 'link', 'textbox', 'checkbox', 'radio', 'combobox',
    'listbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'option', 'searchbox', 'slider', 'spinbutton', 'switch', 'tab',
    'treeitem', 'tabpanel'
  ]);

  const LANDMARK_ROLES = new Set([
    'banner', 'complementary', 'contentinfo', 'form', 'main',
    'navigation', 'region', 'search'
  ]);

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'META', 'LINK', 'BR', 'HR'
  ]);

  function getRole(el) {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    const tag = el.tagName;
    if (tag === 'A' && el.hasAttribute('href')) return 'link';
    if (tag === 'BUTTON') return 'button';
    if (tag === 'INPUT') {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit' || type === 'button' || type === 'reset') return 'button';
      if (type === 'search') return 'searchbox';
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      return 'textbox';
    }
    if (tag === 'TEXTAREA') return 'textbox';
    if (tag === 'SELECT') return 'combobox';
    if (tag === 'IMG') return 'img';
    if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') return 'heading';
    if (tag === 'NAV') return 'navigation';
    if (tag === 'MAIN') return 'main';
    if (tag === 'HEADER') return 'banner';
    if (tag === 'FOOTER') return 'contentinfo';
    if (tag === 'ASIDE') return 'complementary';
    if (tag === 'FORM') return 'form';
    if (tag === 'TABLE') return 'table';
    if (tag === 'TR') return 'row';
    if (tag === 'TH') return 'columnheader';
    if (tag === 'TD') return 'cell';
    if (tag === 'UL' || tag === 'OL') return 'list';
    if (tag === 'LI') return 'listitem';
    if (tag === 'DIALOG') return 'dialog';
    if (tag === 'DETAILS') return 'group';
    if (tag === 'SUMMARY') return 'button';
    return '';
  }

  function getName(el) {
    // aria-label first
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    // aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const parts = labelledBy.split(' ').map(id => {
        const ref = document.getElementById(id);
        return ref ? ref.textContent.trim() : '';
      }).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    // title (guard against SVGAnimatedString where .title is an object)
    if (el.title && typeof el.title === 'string') return el.title.trim();
    // For inputs, check associated label
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      if (el.id) {
        const label = document.querySelector('label[for="' + el.id + '"]');
        if (label) return label.textContent.trim();
      }
      const placeholder = el.getAttribute('placeholder');
      if (placeholder) return placeholder.trim();
    }
    // For images
    if (el.tagName === 'IMG') {
      return (el.alt || '').trim();
    }
    // For links and buttons, use text content
    if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'SUMMARY') {
      const text = el.textContent.trim();
      if (text.length < 100) return text;
      return text.slice(0, 97) + '...';
    }
    // For headings
    if (/^H[1-6]$/.test(el.tagName)) {
      const text = el.textContent.trim();
      if (text.length < 100) return text;
      return text.slice(0, 97) + '...';
    }
    return '';
  }

  function isVisible(el) {
    if (el === document.body) return true;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  }

  function walk(el, depth) {
    if (!el || !el.tagName) return [];
    if (SKIP_TAGS.has(el.tagName)) return [];
    if (!isVisible(el)) return [];

    const lines = [];
    const role = getRole(el);
    const name = getName(el);
    const indent = '  '.repeat(depth);

    const isInteractive = INTERACTIVE_TAGS.has(el.tagName) || INTERACTIVE_ROLES.has(role);
    const isLandmark = LANDMARK_ROLES.has(role);
    const isHeading = role === 'heading';
    const isTable = role === 'table';
    const isDialog = role === 'dialog';

    let ref = null;
    if (isInteractive || (isLandmark && name) || isDialog) {
      ref = refCounter++;
      el.setAttribute('data-pw-ref', String(ref));
    }

    const shouldRender = ref || isHeading || isTable || isDialog || (isLandmark && name);

    if (shouldRender) {
      let line = indent;
      if (ref) line += '[' + ref + '] ';
      line += role || el.tagName.toLowerCase();
      if (name) line += ' "' + name + '"';

      // Add state info
      const states = [];
      if (el.disabled) states.push('disabled');
      if (el.checked) states.push('checked');
      if (el.tagName === 'INPUT') states.push('type=' + (el.type || 'text'));
      if (el.getAttribute('aria-expanded') === 'true') states.push('expanded');
      if (el.getAttribute('aria-expanded') === 'false') states.push('collapsed');
      if (el.getAttribute('aria-selected') === 'true') states.push('selected');
      if (isHeading) {
        const level = el.tagName.replace('H', '');
        states.push('level=' + level);
      }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const val = el.value;
        if (val) states.push('value="' + val.slice(0, 30) + (val.length > 30 ? '...' : '') + '"');
      }
      if (states.length) line += ' (' + states.join(', ') + ')';

      lines.push(line);
    }

    // For text-only leaf nodes, show text content
    if (!shouldRender && el.children.length === 0 && el.textContent.trim()) {
      const text = el.textContent.trim();
      if (text.length > 0 && text.length < 120) {
        lines.push(indent + '"' + text + '"');
      }
    }

    // Recurse into children
    for (const child of el.children) {
      lines.push(...walk(child, shouldRender ? depth + 1 : depth));
    }

    return lines;
  }

  // Clean up old refs first
  document.querySelectorAll('[data-pw-ref]').forEach(el => el.removeAttribute('data-pw-ref'));

  const tree = walk(document.body, 0);
  return { tree, refCount: refCounter - 1 };
})()`;

export async function takeSnapshot(
  page: Page,
  session: Session,
): Promise<string> {
  // Reset refs for fresh snapshot
  session.refs.clear();
  session.nextRef = 1;

  const header = `Page: ${page.url()}\nTitle: ${await page.title()}\n${"─".repeat(60)}`;

  let result: { tree: string[]; refCount: number } | null = null;
  try {
    // Wait for body to exist before walking
    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});
    const raw = await page.evaluate(DOM_WALKER_SCRIPT);
    if (raw && typeof raw === "object" && "tree" in raw) {
      result = raw as { tree: string[]; refCount: number };
    }
  } catch {
    // CSP blocks eval, page not ready, or other issue
  }

  if (!result || !result.tree || result.tree.length === 0) {
    return `${header}\n(snapshot unavailable — page may still be loading, use iframes, or block script evaluation. Try browser_take_screenshot instead.)`;
  }

  // Build ref map: ref number → data-pw-ref selector
  for (let i = 1; i <= result.refCount; i++) {
    session.refs.set(i, `[data-pw-ref="${i}"]`);
  }
  session.nextRef = result.refCount + 1;

  // Cap output to prevent token overflow (keep first 500 lines)
  const lines = result.tree;
  if (lines.length > 500) {
    const truncated = lines.slice(0, 500);
    truncated.push(
      `\n... (${lines.length - 500} more lines truncated — page is very large)`,
    );
    return `${header}\n${truncated.join("\n")}`;
  }

  return `${header}\n${lines.join("\n")}`;
}

export function resolveRef(session: Session, ref: number): string {
  const selector = session.refs.get(ref);
  if (!selector) {
    throw new Error(
      `Ref [${ref}] not found. Take a new snapshot to get current refs.`,
    );
  }
  return selector;
}

export function resolveTarget(
  session: Session,
  ref?: number,
  selector?: string,
): string {
  if (ref !== undefined) return resolveRef(session, ref);
  if (selector) return selector;
  throw new Error("Provide either ref (from snapshot) or selector.");
}
