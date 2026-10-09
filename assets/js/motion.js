/*
 * VETRADENT 02 motion helpers. Enqueue in the footer, no dependencies.
 * Every effect is an enhancement: content is complete without this file.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hasSDA = root.classList.contains('has-sda');

  /* ---------- split text into words / chars ---------- */
  function split(el) {
    const mode = el.getAttribute('data-split') || (el.hasAttribute('data-scrub') ? 'words' : 'chars');
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let index = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const word = document.createElement('span');
        word.className = 'split-word';
        word.setAttribute('aria-hidden', 'true');
        if (mode === 'chars') {
          for (const ch of part) {
            const c = document.createElement('span');
            c.className = 'split-char';
            c.textContent = ch;
            c.style.setProperty('--i', index++);
            c.style.setProperty('--r', String(Math.round(Math.random() * 30 - 15)));
            word.appendChild(c);
          }
        } else {
          word.textContent = part;
          word.style.setProperty('--i', index++);
        }
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.style.setProperty('--n', Math.max(index, 1));
  }
  document.querySelectorAll('[data-split], [data-scrub]').forEach(split);

  /* ---------- stagger indices ---------- */
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
  });
  document.querySelectorAll('.vd-marker').forEach((m, i, all) => {
    const siblings = Array.from(m.parentElement.querySelectorAll('.vd-marker'));
    m.style.setProperty('--m', siblings.indexOf(m));
  });

  /* ---------- in-view toggling ---------- */
  const inviewTargets = document.querySelectorAll('[data-reveal], [data-split="chars"], .vd-marker, [data-inview], [data-scramble], [data-count]');
  function reveal(el) {
    el.classList.add('is-inview');
    if (el.hasAttribute('data-scramble')) scramble(el);
    if (el.hasAttribute('data-count') && !hasSDA) countUp(el);
  }
  if ('IntersectionObserver' in window && !reduced.matches) {
    // Chrome clips intersection by the target's own clip-path, so fully wiped
    // elements are observed through their parent instead.
    const proxies = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        [entry.target, ...(proxies.get(entry.target) || [])].forEach(reveal);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    inviewTargets.forEach((el) => {
      const wipe = /^wipe/.test(el.getAttribute('data-reveal') || '');
      const target = wipe && el.parentElement ? el.parentElement : el;
      if (target !== el) proxies.set(target, [...(proxies.get(target) || []), el]);
      io.observe(target);
    });
  } else {
    inviewTargets.forEach(reveal);
  }

  /* ---------- letter scramble ---------- */
  function scramble(el) {
    if (reduced.matches || el.dataset.scrambled) return;
    el.dataset.scrambled = '1';
    const target = el.getAttribute('data-scramble') || el.textContent;
    const glyphs = 'VETRADENTvetradent✦★#$%!?';
    const start = performance.now();
    const duration = 1400;
    el.setAttribute('aria-label', target);
    (function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const settled = Math.floor(t * target.length);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        out += i < settled || ch === ' ' ? ch : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- count-up fallback when CSS scroll timelines are missing ---------- */
  function countUp(el) {
    const to = parseFloat(el.style.getPropertyValue('--to')) || 0;
    const out = el.querySelector('.vd-count__static') || el;
    const start = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - start) / 1200);
      out.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- dialogs ---------- */
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-dialog]');
    if (trigger) {
      const dialog = document.getElementById(trigger.getAttribute('data-open-dialog'));
      if (dialog instanceof HTMLDialogElement && !dialog.open) {
        event.preventDefault();
        dialog.showModal();
      }
      return;
    }
    if (event.target instanceof HTMLDialogElement && event.target.open) {
      const r = event.target.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) event.target.close();
    }
  });

  const hashTarget = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (hashTarget && hashTarget.dataset.dialog) {
    const dialog = document.getElementById(hashTarget.dataset.dialog);
    hashTarget.scrollIntoView({ block: 'center', inline: 'center' });
    if (dialog instanceof HTMLDialogElement) setTimeout(() => dialog.showModal(), 450);
  }

  /* ---------- pointer tilt for stickers & cards ---------- */
  if (finePointer.matches && !reduced.matches) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const strength = parseFloat(el.getAttribute('data-tilt')) || 10;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--tilt-x', `${(-y * strength).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * strength).toFixed(2)}deg`);
        el.style.setProperty('--glare-x', `${(x + 0.5) * 100}%`);
        el.style.setProperty('--glare-y', `${(y + 0.5) * 100}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ---------- scroll-spy for in-page pill navs ---------- */
  document.querySelectorAll('[data-spy]').forEach((nav) => {
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;
    const setActive = (id) => {
      links.forEach((a, i) => {
        const on = a.getAttribute('href') === `#${id}`;
        a.toggleAttribute('aria-current', on);
        if (on) {
          nav.style.setProperty('--spy', i);
          if (nav.scrollWidth > nav.clientWidth) {
            const c = a.getBoundingClientRect();
            const r = nav.getBoundingClientRect();
            nav.scrollTo({ left: nav.scrollLeft + c.left - r.left - (r.width - c.width) / 2, behavior: reduced.matches ? 'auto' : 'smooth' });
          }
        }
      });
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
    if (!nav.querySelector('[aria-current]')) links[0].setAttribute('aria-current', 'true');
  });

  /* ---------- rails: arrow buttons + active dot ---------- */
  document.querySelectorAll('[data-rail]').forEach((wrap) => {
    const rail = wrap.querySelector('.vd-rail');
    const dots = wrap.querySelectorAll('.vd-rail-dots button');
    if (!rail) return;
    wrap.querySelectorAll('[data-rail-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = parseInt(btn.getAttribute('data-rail-step'), 10);
        const card = rail.children[0];
        rail.scrollBy({ left: dir * (card ? card.getBoundingClientRect().width + 16 : 300), behavior: 'smooth' });
      });
    });
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      const c = rail.children[i].getBoundingClientRect();
      const r = rail.getBoundingClientRect();
      rail.scrollTo({ left: rail.scrollLeft + c.left - r.left - (r.width - c.width) / 2, behavior: reduced.matches ? 'auto' : 'smooth' });
    }));
    if (dots.length && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Array.from(rail.children).indexOf(entry.target);
          dots.forEach((d, i) => d.toggleAttribute('data-active', i === idx));
        });
      }, { root: rail, threshold: 0.6 });
      Array.from(rail.children).forEach((c) => obs.observe(c));
    }
  });
})();
