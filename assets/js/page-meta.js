/**
 * Reviewer dock: toggle live Title Tag + Meta Description.
 * Shadow DOM keeps preview controls off the design canvas.
 */
(function () {
  'use strict';

  const EXPANDED_KEY = 'vd-page-meta-expanded';

  const STYLES = `
  :host {
    position: fixed;
    bottom: var(--vd-meta-bottom, 1rem);
    left: 1rem;
    z-index: 9999;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 0.8125rem;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
  }
  @media print { :host { display: none !important; } }
  .dock {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    max-width: min(22rem, calc(100vw - 2rem));
    padding: 0.375rem;
    border-radius: 1rem;
    background: rgba(30, 30, 32, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: #e8e8ea;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    user-select: none;
  }
  .dock__handle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.625rem;
    cursor: pointer;
  }
  .dock__handle input {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0);
    white-space: nowrap; border: 0;
  }
  .dock__switch {
    position: relative;
    display: inline-block;
    width: 2rem; height: 1.125rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    transition: background 0.15s ease;
  }
  .dock__switch::after {
    content: "";
    position: absolute;
    top: 0.125rem; left: 0.125rem;
    width: 0.875rem; height: 0.875rem;
    border-radius: 999px;
    background: #fff;
    transition: transform 0.15s ease;
  }
  .dock__handle input:checked + .dock__switch { background: #7a2981; }
  .dock__handle input:checked + .dock__switch::after { transform: translateX(0.875rem); }
  .dock__label {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
  }
  .dock__panel {
    display: none;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.35rem 0.65rem 0.55rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .dock--expanded .dock__panel { display: flex; }
  .dock__field {
    display: grid;
    gap: 0.2rem;
  }
  .dock__field dt {
    margin: 0;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .dock__field dd {
    margin: 0;
    color: #fff;
    font-weight: 500;
    white-space: normal;
    overflow-wrap: anywhere;
    user-select: text;
  }
  `;

  class PageMeta extends HTMLElement {
    #toggle = null;
    #dock = null;
    #pageEl = null;
    #titleEl = null;
    #descEl = null;

    connectedCallback() {
      if (this.shadowRoot) {
        this.#refresh();
        return;
      }
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="dock" part="dock">
          <label class="dock__handle" title="Toggle page metadata">
            <input type="checkbox" id="page-meta-toggle" aria-controls="page-meta-panel" />
            <span class="dock__switch" aria-hidden="true"></span>
            <span class="dock__label">Meta</span>
          </label>
          <div id="page-meta-panel" class="dock__panel" role="region" aria-label="Page metadata">
            <dl class="dock__field">
              <dt>Page</dt>
              <dd data-meta="page"></dd>
            </dl>
            <dl class="dock__field">
              <dt>Title Tag</dt>
              <dd data-meta="title"></dd>
            </dl>
            <dl class="dock__field">
              <dt>Meta Description</dt>
              <dd data-meta="description"></dd>
            </dl>
          </div>
        </div>
      `;
      this.#toggle = shadow.getElementById('page-meta-toggle');
      this.#dock = shadow.querySelector('.dock');
      this.#pageEl = shadow.querySelector('[data-meta="page"]');
      this.#titleEl = shadow.querySelector('[data-meta="title"]');
      this.#descEl = shadow.querySelector('[data-meta="description"]');
      this.#toggle.addEventListener('change', () => this.#applyExpanded(this.#toggle.checked));
      this.#applyExpanded(localStorage.getItem(EXPANDED_KEY) === 'true');
      this.#refresh();
      document.addEventListener('vd:page-meta', () => this.#refresh());
      const html = document.documentElement;
      if (html && window.MutationObserver) {
        new MutationObserver(() => this.#refresh()).observe(html, {
          attributes: true,
          attributeFilter: ['data-page'],
        });
      }
      const meta = document.querySelector('meta[name="description"]');
      if (meta && window.MutationObserver) {
        new MutationObserver(() => this.#refresh()).observe(meta, {
          attributes: true,
          attributeFilter: ['content'],
        });
      }
    }

    #applyExpanded(expanded) {
      if (!this.#toggle || !this.#dock) return;
      this.#toggle.checked = expanded;
      this.#dock.classList.toggle('dock--expanded', expanded);
      this.#toggle.setAttribute('aria-expanded', String(expanded));
      localStorage.setItem(EXPANDED_KEY, String(expanded));
    }

    #refresh() {
      if (!this.#pageEl || !this.#titleEl || !this.#descEl) return;
      const meta = document.querySelector('meta[name="description"]');
      const page = (document.documentElement.getAttribute('data-page') || '').trim();
      this.#pageEl.textContent = page || '—';
      this.#titleEl.textContent = document.title || '—';
      this.#descEl.textContent = (meta && meta.getAttribute('content')) || '—';
    }
  }

  if (!customElements.get('page-meta')) {
    customElements.define('page-meta', PageMeta);
  }

  function ensurePageMeta() {
    if (!document.querySelector('page-meta')) {
      document.body.appendChild(document.createElement('page-meta'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensurePageMeta);
  } else {
    ensurePageMeta();
  }
})();
