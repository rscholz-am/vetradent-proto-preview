/**
 * Prototype page-state dock (SFPC-style).
 * Shadow DOM keeps preview controls off the design canvas.
 * States with action:true fire vd:page-action without changing data-state.
 */
(function () {
  'use strict';

  const EXPANDED_KEY = 'vd-page-states-expanded';
  const STATE_KEY_PREFIX = 'vd-page-state:';

  const STYLES = `
  :host {
    position: fixed;
    bottom: var(--vd-dock-bottom, 1rem);
    right: 1rem;
    z-index: 9999;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 0.8125rem;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
  }
  @media print { :host { display: none !important; } }
  .dock {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    max-width: calc(100vw - 2rem);
    flex-wrap: wrap;
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
  .dock__content {
    display: none;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding-left: 0.375rem;
    margin-left: 0.125rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }
  .dock--expanded .dock__content { display: flex; }
  .dock__content button {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.625rem;
    border-radius: 0.5rem;
    color: #e8e8ea;
    background: transparent;
    border: none;
    font-weight: 500;
    font-size: inherit;
    font-family: inherit;
    line-height: inherit;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .dock__content button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .dock__content button[aria-pressed="true"] {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
  }
  .dock__content button.is-action {
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
  .dock__content button.is-action[aria-pressed="true"] {
    background: rgba(122, 41, 129, 0.55);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.28);
  }
  `;

  class PageStates extends HTMLElement {
    static get observedAttributes() {
      return ['states', 'default', 'target', 'storage-key', 'label'];
    }

    #toggle = null;
    #dock = null;
    #content = null;
    #currentId = '';

    connectedCallback() {
      if (this.shadowRoot) {
        this.#render();
        return;
      }
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="dock" part="dock">
          <label class="dock__handle" title="Toggle preview states">
            <input type="checkbox" id="page-states-toggle" aria-controls="page-states-content" />
            <span class="dock__switch" aria-hidden="true"></span>
            <span class="dock__label">State</span>
          </label>
          <div id="page-states-content" class="dock__content" role="group" aria-label="Preview states"></div>
        </div>
      `;
      this.#toggle = shadow.getElementById('page-states-toggle');
      this.#dock = shadow.querySelector('.dock');
      this.#content = shadow.getElementById('page-states-content');
      this.#toggle.addEventListener('change', () => this.#applyExpanded(this.#toggle.checked));
      this.#render();
      this.#applyExpanded(localStorage.getItem(this.#expandedKey()) === 'true');
      this.#applyState(this.#resolveInitialState(), { persist: false });
      stackPageStateDocks();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this.#render();
    }

    #states() {
      try {
        const parsed = JSON.parse(this.getAttribute('states') || '[]');
        return Array.isArray(parsed) ? parsed.filter((s) => s && s.id && s.label) : [];
      } catch {
        return [];
      }
    }

    #storageKey() {
      return this.getAttribute('storage-key') || window.location.pathname;
    }

    #expandedKey() {
      return EXPANDED_KEY + ':' + this.#storageKey();
    }

    #pageStates() {
      return this.#states().filter((s) => !s.action);
    }

    #resolveInitialState() {
      const states = this.#pageStates();
      const ids = states.map((s) => s.id);
      const stored = localStorage.getItem(STATE_KEY_PREFIX + this.#storageKey());
      if (stored && ids.includes(stored)) return stored;
      const fallback = this.getAttribute('default') || (states[0] && states[0].id) || '';
      return ids.includes(fallback) ? fallback : ids[0] || '';
    }

    #applyExpanded(expanded) {
      if (!this.#toggle || !this.#dock) return;
      this.#toggle.checked = expanded;
      this.#dock.classList.toggle('dock--expanded', expanded);
      this.#toggle.setAttribute('aria-expanded', String(expanded));
      localStorage.setItem(this.#expandedKey(), String(expanded));
    }

    #targetEls() {
      const selector = this.getAttribute('target') || 'html';
      const nodes = document.querySelectorAll(selector);
      return nodes.length ? [...nodes] : [document.documentElement];
    }

    select(id) {
      const ids = this.#pageStates().map((s) => s.id);
      if (!ids.includes(id)) return;
      this.#applyState(id);
    }

    #applyState(id, { persist = true } = {}) {
      if (!id) return;
      this.#currentId = id;
      this.#targetEls().forEach((target) => {
        target.setAttribute('data-state', id);
        if (target.id === 'fit-finder' || target.matches('#fit-finder')) {
          target.setAttribute('data-fyf-view', id);
        }
      });
      document.documentElement.setAttribute('data-page-state', id);
      if (persist) localStorage.setItem(STATE_KEY_PREFIX + this.#storageKey(), id);
      this.#syncButtons();
      this.dispatchEvent(
        new CustomEvent('vd:page-state', {
          bubbles: true,
          composed: true,
          detail: { id },
        })
      );
    }

    #fireAction(id, { on } = {}) {
      this.dispatchEvent(
        new CustomEvent('vd:page-action', {
          bubbles: true,
          composed: true,
          detail: { id, on: !!on },
        })
      );
    }

    #syncButtons() {
      if (!this.#content) return;
      this.#content.querySelectorAll('button[data-state-id]').forEach((btn) => {
        const isAction = btn.classList.contains('is-action');
        const isToggle = btn.getAttribute('data-toggle') === '1';
        if (isToggle) return;
        btn.setAttribute('aria-pressed', String(!isAction && btn.getAttribute('data-state-id') === this.#currentId));
      });
    }

    #esc(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    #render() {
      if (!this.#content) return;
      const label = (this.getAttribute('label') || 'State').trim() || 'State';
      const handleLabel = this.shadowRoot.querySelector('.dock__label');
      if (handleLabel) handleLabel.textContent = label;
      this.#content.setAttribute('aria-label', `${label} states`);
      const states = this.#states();
      this.#content.innerHTML = states
        .map((state) => {
          const isAction = !!state.action;
          const isToggle = !!state.toggle;
          return `<button
            type="button"
            class="${isAction ? 'is-action' : ''}"
            data-state-id="${this.#esc(state.id)}"
            data-action="${isAction ? '1' : '0'}"
            data-toggle="${isToggle ? '1' : '0'}"
            aria-pressed="false"
          >${this.#esc(state.label)}</button>`;
        })
        .join('');
      this.#content.querySelectorAll('button[data-state-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-state-id') || '';
          if (btn.getAttribute('data-action') === '1') {
            if (btn.getAttribute('data-toggle') === '1') {
              const on = btn.getAttribute('aria-pressed') !== 'true';
              btn.setAttribute('aria-pressed', String(on));
              this.#fireAction(id, { on });
            } else {
              this.#fireAction(id, { on: true });
            }
          } else {
            this.#applyState(id);
          }
        });
      });
    }
  }

  if (!customElements.get('page-states')) {
    customElements.define('page-states', PageStates);
  }

  function stackPageStateDocks() {
    document.querySelectorAll('page-states').forEach((el, i) => {
      el.style.setProperty('--vd-dock-bottom', `${1 + i * 2.85}rem`);
    });
  }
})();
