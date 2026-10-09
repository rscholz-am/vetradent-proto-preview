/*
 * VETRADENT 02 block stores. Written against the Interactivity API surface
 * (store / getContext / getElement) so each store can move into a block's
 * view.js module unchanged.
 */
(function () {
  'use strict';
  const { store, getContext, getElement, start } = window.vdInteractivity;

  // Segmented toggle (Biotrate "binds / softens", any two-or-more state switch).
  store('vetradent/toggle', {
    state: {
      get isActive() {
        const ctx = getContext();
        return ctx.active === ctx.value;
      },
      get activeIndex() {
        const ctx = getContext();
        return String(ctx.options ? ctx.options.indexOf(ctx.active) : 0);
      },
    },
    actions: {
      select() {
        const ctx = getContext();
        ctx.active = ctx.value;
      },
      cycle() {
        const ctx = getContext();
        const i = ctx.options.indexOf(ctx.active);
        ctx.active = ctx.options[(i + 1) % ctx.options.length];
      },
    },
  });

  // Persona card deck: tap to send the top card to the back.
  store('vetradent/deck', {
    state: {
      get position() {
        const ctx = getContext();
        return String((ctx.idx - ctx.top + ctx.count) % ctx.count);
      },
      get isTop() {
        const ctx = getContext();
        return (ctx.idx - ctx.top + ctx.count) % ctx.count === 0;
      },
      get counter() {
        const ctx = getContext();
        return `${ctx.top + 1} / ${ctx.count}`;
      },
    },
    actions: {
      next() {
        const ctx = getContext();
        ctx.top = (ctx.top + 1) % ctx.count;
      },
      prev() {
        const ctx = getContext();
        ctx.top = (ctx.top - 1 + ctx.count) % ctx.count;
      },
      focus() {
        const ctx = getContext();
        ctx.top = ctx.idx;
      },
      // Swipe the top card away; pointer capture only starts once the drag is
      // real, so taps still reach the buttons inside the card.
      dragStart(event) {
        const ctx = getContext();
        if (event.button !== 0 || event.target.closest('button, a')) return;
        ctx.drag = { x: event.clientX, dx: 0, id: event.pointerId, live: false };
      },
      dragMove(event) {
        const ctx = getContext();
        const drag = ctx.drag;
        if (!drag || drag.id !== event.pointerId) return;
        const el = getElement().ref;
        drag.dx = event.clientX - drag.x;
        if (!drag.live && Math.abs(drag.dx) > 8) {
          drag.live = true;
          el.classList.add('is-dragging');
          try { el.setPointerCapture(event.pointerId); } catch (_) {}
        }
        if (drag.live) {
          el.style.setProperty('--dx', `${drag.dx}px`);
          el.style.setProperty('--dr', (drag.dx / 18).toFixed(2));
        }
      },
      dragEnd() {
        const ctx = getContext();
        const drag = ctx.drag;
        if (!drag) return;
        const el = getElement().ref;
        el.classList.remove('is-dragging');
        el.style.removeProperty('--dx');
        el.style.removeProperty('--dr');
        ctx.drag = null;
        if (drag.live && Math.abs(drag.dx) > 70) ctx.top = (ctx.top + (drag.dx < 0 ? 1 : ctx.count - 1)) % ctx.count;
      },
    },
  });

  // Contact form: native validation, client-side thanks state.
  store('vetradent/form', {
    state: {
      get sent() { return getContext().sent; },
    },
    actions: {
      submit(event) {
        event.preventDefault();
        const form = getElement().ref;
        if (!form.checkValidity()) { form.reportValidity(); return; }
        getContext().sent = true;
      },
      reset() { getContext().sent = false; },
    },
  });

  start();
})();
