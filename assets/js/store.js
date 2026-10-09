/*
 * Minimal runtime for WordPress Interactivity API directives.
 * Supports: data-wp-interactive, data-wp-context, data-wp-on--{event},
 * data-wp-class--{name}, data-wp-bind--{attr}, data-wp-style--{prop},
 * data-wp-text, data-wp-init, data-wp-watch.
 * In a block theme, delete this file and import { store, getContext, getElement }
 * from '@wordpress/interactivity' instead; blocks.js is written against that API.
 */
(function () {
  'use strict';

  const stores = {};
  const contexts = new WeakMap();
  const bindings = [];
  let scope = null;

  function store(ns, def) {
    const s = stores[ns] || (stores[ns] = { state: {}, actions: {}, callbacks: {} });
    for (const key of ['state', 'actions', 'callbacks']) {
      if (def && def[key]) Object.defineProperties(s[key], Object.getOwnPropertyDescriptors(def[key]));
    }
    return s;
  }

  function getContext() {
    if (!scope) throw new Error('getContext() called outside a directive');
    return scope.ctx;
  }
  function getElement() {
    return { ref: scope ? scope.el : null };
  }

  function makeContext(own, parent) {
    // defineProperties, not assign: [[Set]] would walk into the parent proxy's trap.
    const base = Object.create(parent || null, Object.getOwnPropertyDescriptors(own));
    return new Proxy(base, {
      set(target, key, value) {
        let owner = target;
        while (owner && !Object.prototype.hasOwnProperty.call(owner, key)) owner = Object.getPrototypeOf(owner);
        (owner || target)[key] = value;
        return true;
      },
    });
  }

  function contextFor(el) {
    if (contexts.has(el)) return contexts.get(el);
    const parentEl = el.parentElement && el.parentElement.closest('[data-wp-context]');
    const parent = parentEl ? contextFor(parentEl) : null;
    let own = {};
    if (el.hasAttribute('data-wp-context')) {
      try { own = JSON.parse(el.getAttribute('data-wp-context')); } catch (e) { console.warn('Bad data-wp-context', el, e); }
    }
    const ctx = el.hasAttribute('data-wp-context') ? makeContext(own, parent) : parent;
    contexts.set(el, ctx);
    return ctx;
  }

  function namespaceFor(el) {
    const host = el.closest('[data-wp-interactive]');
    if (!host) return null;
    const raw = host.getAttribute('data-wp-interactive');
    if (raw.trim().startsWith('{')) { try { return JSON.parse(raw).namespace; } catch (_) { return null; } }
    return raw;
  }

  function evaluate(el, path, event) {
    const ns = namespaceFor(el);
    const ctxEl = el.closest('[data-wp-context]');
    const ctx = ctxEl ? contextFor(ctxEl) : {};
    const negate = path.startsWith('!');
    const parts = (negate ? path.slice(1) : path).split('.');
    const s = stores[ns] || store(ns, {});
    const prev = scope;
    scope = { el, ctx };
    let value;
    try {
      let target = parts[0] === 'context' ? ctx : s[parts[0]];
      let parent = null;
      for (let i = 1; i < parts.length && target != null; i++) { parent = target; target = target[parts[i]]; }
      value = typeof target === 'function' ? target.call(parent, event) : target;
    } finally {
      scope = prev;
    }
    return negate ? !value : value;
  }

  function apply(b) {
    const value = evaluate(b.el, b.path);
    switch (b.type) {
      case 'class': b.el.classList.toggle(b.arg, !!value); break;
      case 'style':
        if (value == null || value === false) b.el.style.removeProperty(b.arg);
        else b.el.style.setProperty(b.arg, value);
        break;
      case 'text': b.el.textContent = value == null ? '' : value; break;
      case 'bind':
        if (/^(aria|data)-/.test(b.arg) && typeof value === 'boolean') b.el.setAttribute(b.arg, String(value));
        else if (value === false || value == null) b.el.removeAttribute(b.arg);
        else if (value === true) b.el.setAttribute(b.arg, '');
        else b.el.setAttribute(b.arg, value);
        if (b.arg in b.el && typeof value !== 'object') { try { b.el[b.arg] = value; } catch (_) {} }
        break;
      case 'watch': evaluate(b.el, b.path); break;
    }
  }

  let queued = false;
  function render() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; bindings.forEach(apply); });
  }

  function hydrate(root) {
    const els = [root, ...root.querySelectorAll('*')];
    for (const el of els) {
      for (const attr of Array.from(el.attributes)) {
        const m = attr.name.match(/^data-wp-(on|class|bind|style|text|init|watch)(?:--(.+))?$/);
        if (!m) continue;
        const [, type, arg] = m;
        const path = attr.value.trim();
        if (type === 'on') {
          el.addEventListener(arg, (event) => { evaluate(el, path, event); render(); });
        } else if (type === 'init') {
          evaluate(el, path);
        } else {
          bindings.push({ el, type, arg, path });
        }
      }
    }
  }

  function start() {
    document.querySelectorAll('[data-wp-interactive]').forEach((root) => {
      if (!root.parentElement || !root.parentElement.closest('[data-wp-interactive]')) hydrate(root);
    });
    bindings.forEach(apply);
  }

  window.vdInteractivity = { store, getContext, getElement, render, start };
})();
