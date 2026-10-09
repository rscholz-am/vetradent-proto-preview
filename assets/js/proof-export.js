/**
 * Proof pack / ?proof=1 — expand hidden content and prepare print → Save as PDF.
 */
(function () {
  'use strict';

  function isProofMode() {
    if (document.documentElement.classList.contains('proof')) return true;
    try {
      return new URLSearchParams(location.search).get('proof') === '1';
    } catch (_) {
      return false;
    }
  }

  function assetRootFromPath() {
    const path = location.pathname || '';
    if (path.includes('/proof/')) return '../';
    const depth = path.split('/').filter(Boolean).length;
    // .../pet-owner/find-your-fit/ → two segments under site → ../../
    if (depth >= 2) return '../'.repeat(Math.max(1, depth - (path.endsWith('/') ? 0 : 1)));
    return './';
  }

  function eagerLoadImages() {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
      img.removeAttribute('loading');
      // Nudge the loader if the browser deferred the request
      if (!img.complete && img.src) {
        const src = img.getAttribute('src');
        if (src) img.setAttribute('src', src);
      }
    });
  }

  function whenImageReady(img) {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (typeof img.decode === 'function') {
      return img.decode().catch(() => waitForLoadOrError(img));
    }
    return waitForLoadOrError(img);
  }

  function waitForLoadOrError(img) {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
        return;
      }
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  function waitForImages() {
    return Promise.all(Array.from(document.images).map(whenImageReady));
  }

  async function printProof() {
    eagerLoadImages();
    try {
      await waitForImages();
    } catch (_) {
      /* still print — missing assets should not block verification */
    }
    window.print();
  }

  /** Move dialogs out of grid tiles so open popups do not overlap neighboring cards. */
  function unnestDialogs() {
    document.querySelectorAll('li .vd-dialog, .spec-tile .vd-dialog').forEach((dlg) => {
      const grid = dlg.closest('.portfolio__grid, ol, ul');
      const section = dlg.closest('section') || dlg.parentElement;
      const anchor = grid || section;
      if (!anchor || !anchor.parentElement) return;

      let host = null;
      if (grid && grid.parentElement) {
        host = grid.parentElement.querySelector(':scope > .proof-dialogs');
        if (!host) {
          host = document.createElement('div');
          host.className = 'proof-dialogs';
          grid.after(host);
        }
      } else {
        host = section.querySelector(':scope > .proof-dialogs');
        if (!host) {
          host = document.createElement('div');
          host.className = 'proof-dialogs';
          section.appendChild(host);
        }
      }
      host.appendChild(dlg);
    });
  }

  function widthToPx(value, unit) {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return null;
    if (unit === 'px') return n;
    // rem/em — proof pack assumes root 16px
    return n * 16;
  }

  function parseWidthPx(mediaText, which) {
    const re = which === 'max'
      ? /max-width:\s*([\d.]+)(rem|em|px)/i
      : /min-width:\s*([\d.]+)(rem|em|px)/i;
    const m = String(mediaText || '').match(re);
    return m ? widthToPx(m[1], m[2]) : null;
  }

  /**
   * Hoist desktop @media (min-width) rules so layouts stay desktop even when the
   * browser/print page is narrower than 64–80rem (common for tabloid PDF).
   * Also disables mobile-only max-width layout media.
   */
  function forceDesktopStyles() {
    if (document.getElementById('proof-force-desktop')) return;
    const DESKTOP_BP = 80 * 16; // include our largest layout breakpoint (80rem)
    const chunks = [];

    function walk(rulesList) {
      if (!rulesList) return;
      for (const rule of Array.from(rulesList)) {
        const type = rule.type;

        if (type === CSSRule.SUPPORTS_RULE) {
          walk(rule.cssRules);
          continue;
        }

        if (type === CSSRule.MEDIA_RULE) {
          const media = rule.conditionText || (rule.media && rule.media.mediaText) || '';
          const minPx = parseWidthPx(media, 'min');
          const maxPx = parseWidthPx(media, 'max');
          const hasWidth = minPx != null || maxPx != null;

          // Recurse into non-width media (e.g. prefers-reduced-motion) to find nested min-width
          if (!hasWidth) {
            walk(rule.cssRules);
            continue;
          }

          // Disable mobile-only max-width layout queries
          if (maxPx != null && minPx == null && maxPx < DESKTOP_BP) {
            try {
              rule.media.mediaText = 'not all';
            } catch (_) {
              /* ignore */
            }
            continue;
          }

          // Hoist min-width rules that apply at a 1280px desktop canvas
          if (minPx != null && minPx <= DESKTOP_BP) {
            if (maxPx != null && maxPx < minPx) continue;
            for (const inner of Array.from(rule.cssRules || [])) {
              if (inner.type === CSSRule.STYLE_RULE || inner.type === CSSRule.KEYFRAMES_RULE) {
                chunks.push(inner.cssText);
              } else if (inner.cssRules) {
                walk(inner.cssRules);
              } else if (inner.cssText) {
                chunks.push(inner.cssText);
              }
            }
          }
          continue;
        }

        if (rule.cssRules) walk(rule.cssRules);
      }
    }

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch (_) {
        /* cross-origin or unreadable */
      }
    }

    const style = document.createElement('style');
    style.id = 'proof-force-desktop';
    style.textContent =
      '/* Proof: desktop @media (min-width ≤ 80rem) hoisted for screen + print */\n' +
      chunks.join('\n');
    document.head.appendChild(style);
    document.documentElement.setAttribute('data-proof-desktop', '1');
  }

  function expandPage() {
    document.documentElement.classList.add('proof', 'no-heavy-scrolly');

    forceDesktopStyles();
    eagerLoadImages();

    // Exclusive <details name> only keeps one open — strip name so FAQ + ingredients expand fully
    document.querySelectorAll('details[name]').forEach((el) => {
      el.removeAttribute('name');
    });
    document.querySelectorAll('details').forEach((el) => {
      el.open = true;
    });

    unnestDialogs();

    document.querySelectorAll('.vd-dialog').forEach((dlg) => {
      dlg.setAttribute('open', '');
      dlg.removeAttribute('hidden');
      try {
        if (typeof dlg.show === 'function' && !dlg.open) dlg.show();
      } catch (_) {
        /* already open / not a dialog */
      }
    });

    document.querySelectorAll('.biotrate__panel').forEach((panel) => {
      panel.classList.add('is-active');
    });

    // Show every Biotrate panel side-by-side (not stacked toggle)
    document.querySelectorAll('.biotrate').forEach((root) => {
      root.setAttribute('data-proof-expanded', '1');
    });

    document.querySelectorAll('[data-reveal], [data-stagger] > *').forEach((el) => {
      el.classList.add('is-inview');
    });

    document.querySelectorAll('[data-fyf-offer]').forEach((offer) => {
      offer.classList.add('is-expanded');
      const toggle = offer.querySelector('[data-fyf-offer-toggle]');
      const backdrop = offer.querySelector('[data-fyf-offer-backdrop]');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.hidden = true;
    });

    // Unhide content-bearing nodes; keep chrome / quiz shells / thanks states alone
    document.querySelectorAll('[hidden]').forEach((el) => {
      if (el.matches('script, style, template')) return;
      if (el.closest('.proof-fyf')) return;
      if (el.matches('[data-fyf]') || el.closest('#fit-finder')) return;
      if (el.matches('.contact__thanks, .fyf-offer__backdrop, .vd-dialog__grab')) return;
      if (el.closest('page-meta, page-states, .proof-toolbar')) return;
      el.hidden = false;
      el.removeAttribute('hidden');
    });

    // Horizontal rails → show every slide (CSS also forces grid)
    document.querySelectorAll('.vd-rail').forEach((rail) => {
      rail.scrollLeft = 0;
      rail.classList.add('is-proof-expanded');
    });
  }

  function dumpFitFinder() {
    const live = document.getElementById('fit-finder');
    if (!live || !window.vdFitFinder || typeof window.vdFitFinder.renderProofDump !== 'function') return;

    const root = live.dataset.root || assetRootFromPath();
    const intro = live.querySelector('[data-fyf="intro"]');
    const introHtml = intro ? intro.innerHTML : '';

    // Stop interactive quiz init from fighting the dump
    live.dataset.ready = '1';
    live.removeAttribute('data-slot');

    window.vdFitFinder.renderProofDump(live, {
      assetRoot: root,
      introHtml,
    });

    // Dump injects more lazy images
    eagerLoadImages();
  }

  function ensureToolbar() {
    if (document.querySelector('.proof-toolbar')) return;
    const bar = document.createElement('div');
    bar.className = 'proof-toolbar';
    bar.innerHTML = `
      <p class="proof-toolbar__title">Proof pack · desktop</p>
      <button type="button" class="proof-toolbar__btn" data-proof-print>Download PDF</button>
      <p class="proof-toolbar__hint">Save as PDF · Tabloid (11×17) · Portrait. Desktop layouts forced on every page; all FAQ/ingredients/dialogs expanded. Keep “Background graphics” on. Email stays 600px.</p>
    `;
    bar.querySelector('[data-proof-print]').addEventListener('click', () => {
      printProof();
    });
    document.body.prepend(bar);
  }

  function boot() {
    if (!isProofMode()) return;
    expandPage();
    dumpFitFinder();
    if (document.documentElement.getAttribute('data-page') === 'Proof Pack' || location.pathname.includes('/proof/')) {
      ensureToolbar();
    }
    window.addEventListener('beforeprint', () => {
      eagerLoadImages();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Fit Finder boots on DOMContentLoaded too; wait a tick so vdFitFinder exists
      window.setTimeout(boot, 0);
    });
  } else {
    window.setTimeout(boot, 0);
  }

  window.vdProofExport = { expandPage, dumpFitFinder, print: printProof, waitForImages, eagerLoadImages };
})();
