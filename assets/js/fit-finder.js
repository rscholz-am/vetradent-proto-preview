/*
 * VETRADENT Fit Finder — Content copy + Strategy scoring.
 * Deferred (not in this build): live Pardot, real XX% offer, HTML email, email landing page.
 */
(function () {
  'use strict';

  const DISCOUNT = 'XX%';
  const OFFER_CODE = 'DOABLEXX';

  const PRODUCTS = {
    water: {
      id: 'water',
      name: 'Water Additive',
      sticker: 'img-sticker-vetradent-water-additive.png',
      hero: 'img-hero-vetradent-water-additive.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+water+additive',
      chewy: 'https://www.chewy.com/s?query=vetradent+water+additive',
      vohc: true,
      vohcBody:
        'VETRADENT® Water Additive and Powder Water Additive have the Veterinary Oral Health Council seal, which means these products have been tested and proven to reduce tartar in dogs.*',
      vohcNote:
        '*Achieved in dogs only. Achieved with once monthly brushing in accordance with the study.',
      blurb: (pet) =>
        `For effortless dental support in every sip, simply add to ${pet}’s drinking water every time you refill their bowl.`,
    },
    powder: {
      id: 'powder',
      name: 'Powder Water Additive',
      sticker: 'img-sticker-vetradent-powder-water-additive.png',
      hero: 'img-water-additive-cat-and-dog-kitchen.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+powder+water+additive',
      chewy: 'https://www.chewy.com/s?query=vetradent+powder+water+additive',
      vohc: true,
      vohcBody:
        'VETRADENT® Water Additive and Powder Water Additive have the Veterinary Oral Health Council seal, which means these products have been tested and proven to reduce tartar in dogs.*',
      vohcNote:
        '*Achieved in dogs only. Achieved with once monthly brushing in accordance with the study.',
    },
    spray: {
      id: 'spray',
      name: 'Dental Spray',
      sticker: 'img-sticker-vetradent-dental-spray-2oz.png',
      hero: 'img-hero-vetradent-dental-spray.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+dental+spray',
      chewy: 'https://www.chewy.com/s?query=vetradent+dental+spray',
      vohc: false,
      blurb: (pet) =>
        `The perfect solution for pet parents on the go. Simply spray on each side of ${pet}’s mouth twice a day for targeted oral care in seconds — and you’re on to the next thing!`,
      blurbSecondary: (pet) =>
        `The perfect solution for pet parents on the go. Simply spray on each side of ${pet}’s mouth twice a day for targeted oral care in seconds.`,
    },
    wipes: {
      id: 'wipes',
      name: 'Dental Wipes',
      sticker: 'img-sticker-vetradent-dental-wipes.png',
      hero: 'img-hero-vetradent-dental-wipes.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+dental+wipes',
      chewy: 'https://www.chewy.com/s?query=vetradent+dental+wipes',
      vohc: true,
      vohcBody:
        'VETRADENT® Dental Wipes have the Veterinary Oral Health Council seal, which means this product has been tested and proven to reduce tartar in dogs.*',
      vohcNote: '*Achieved in dogs only.',
      blurb: (pet) =>
        `Wipes are the way to go for those who want a quick, hands-on clean. Gently rub the outer surface of ${pet}’s teeth and gumline once daily. You’ll be amazed how a cleaner mouth brings you two closer!`,
    },
    toothpaste: {
      id: 'toothpaste',
      name: 'Toothpaste',
      nameSuffix: 'w/ double-headed toothbrush',
      sticker: 'img-sticker-vetradent-toothpaste-toothbrush.png',
      hero: 'img-hero-vetradent-toothpaste.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+toothpaste',
      chewy: 'https://www.chewy.com/s?query=vetradent+toothpaste',
      vohc: false,
      blurb: (pet) =>
        `When you and ${pet} are this comfortable together, the enhanced cleaning of toothbrushing only makes sense. Gently brush their teeth with a pea-sized amount of allergy-friendly, chicken-flavored toothpaste once daily. No rinsing required!`,
    },
    chews: {
      id: 'chews',
      name: 'Veggie Dental Chews',
      sticker: 'img-sticker-vetradent-veggie-dental-chews.png',
      hero: 'img-hero-vetradent-dental-chews-2.jpg',
      amazon: 'https://www.amazon.com/s?k=vetradent+veggie+dental+chews',
      chewy: 'https://www.chewy.com/s?query=vetradent+veggie+dental+chews',
      vohc: false,
      blurb: () =>
        'A reward that refreshes. Add easy dental care to your routine in just one chew a day.',
      detail:
        'VETRADENT® Veggie Dental Chews have a porous texture that helps clean hard-to-reach teeth down to the gumline, while their 5 distinct ridges work to remove plaque and tartar on the entire tooth.',
    },
  };

  // coop (rows 1–4) × effort (cols 1–4)
  const MATRIX = [
    ['effortless', 'effortless', 'effortless', 'effortless'],
    ['effortless', 'makeItQuick', 'makeItQuick', 'makeItQuick'],
    ['effortless', 'makeItQuick', 'getHandsOn', 'getHandsOn'],
    ['effortless', 'makeItQuick', 'getHandsOn', 'readyForMore'],
  ];

  const ROUTINES = {
    effortless: {
      id: 'effortless',
      name: 'Keep It Effortless',
      primary: 'water',
      secondary: null,
      chewAs: 'readyStar', // Ready for more?
      chewMin: 2,
    },
    makeItQuick: {
      id: 'makeItQuick',
      name: 'Make It Quick',
      primary: 'spray',
      secondary: 'water',
      chewAs: 'bonus',
      chewMin: 3,
    },
    getHandsOn: {
      id: 'getHandsOn',
      name: 'Get Hands-On',
      primary: 'wipes',
      secondary: 'spray',
      chewAs: 'bonus',
      chewMin: 3,
    },
    readyForMore: {
      id: 'readyForMore',
      name: 'Ready for More',
      primary: 'toothpaste',
      secondary: 'wipes',
      chewAs: 'bonus',
      chewMin: 3,
    },
  };

  const QUESTIONS = [
    {
      id: 'species',
      kicker: 'First things first',
      title: 'Who are we finding a routine for?',
      help: 'So we only ever show you products actually made for your pet.',
      type: 'choice',
      options: [
        { value: 'dog', label: 'Dog', icon: 'icon-dog.svg' },
        { value: 'cat', label: 'Cat', icon: 'icon-cat.svg' },
      ],
    },
    {
      id: 'petName',
      kicker: 'Introductions, please',
      title: 'What’s your pet’s name?',
      help: 'We’ll accept silly nicknames too.',
      type: 'text',
      placeholder: 'Pet name',
    },
    {
      id: 'coop',
      kicker: 'Handling & comfort',
      title: 'How does {{pet}} react when you touch their mouth?',
      help: 'We won’t recommend anything to a pet (or human) who isn’t ready for it yet.',
      tip: 'A few seconds of positive practice each day can go a long way.',
      type: 'choice',
      options: [
        { value: 1, label: 'Doesn’t tolerate it at all' },
        { value: 2, label: 'Tolerates it briefly' },
        { value: 3, label: 'Generally cooperative' },
        { value: 4, label: 'Totally comfortable, even brushing!' },
      ],
    },
    {
      id: 'current',
      kicker: 'Your routine today',
      title: 'What does your dental routine look like right now?',
      help: 'No judgment — we’re just finding the right place to start.',
      tip: 'Make small moves! One doable step is better than an ambitious routine that’s hard to keep.',
      type: 'choice',
      options: [
        { value: 'scratch', label: 'Starting from scratch' },
        { value: 'building', label: 'Building a habit' },
        { value: 'inconsistent', label: 'Doing our best but inconsistent TBH' },
        { value: 'everyday', label: 'Already part of our everyday' },
      ],
    },
    {
      id: 'effort',
      kicker: 'Energy level & output',
      title: 'How much effort feels realistic for dental care?',
      help: 'We’ll match your routine to what you can actually manage, not what looks best on paper.',
      tip: 'If you’re always short on time, try habit-stacking. Pair your pet’s dental care with something you do every day to make follow-through easier.',
      type: 'choice',
      options: [
        { value: 1, label: 'Something seamless — if it isn’t easy, it isn’t happening' },
        { value: 2, label: 'Good with adding one quick step' },
        { value: 3, label: 'A short, hands-on routine works for me' },
        { value: 4, label: 'I’ll make time for something more involved' },
      ],
    },
    {
      id: 'treat',
      kicker: 'For dogs only',
      title: 'How does {{pet}} feel about treats?',
      help: 'We had to ask. Some dogs will surprise you!',
      tip: 'A little enthusiasm goes a long way. Try a routine they’ll happily repeat.',
      dogsOnly: true,
      type: 'choice',
      options: [
        { value: 4, label: 'Treat time is the best time' },
        { value: 3, label: 'Pretty food motivated' },
        { value: 2, label: 'Could take them or leave them' },
        { value: 1, label: 'Treats really aren’t our thing' },
      ],
    },
    {
      id: 'concerns',
      kicker: 'Almost there',
      title: 'Any specific dental concerns for {{pet}}?',
      help: 'Your answer here won’t change your dental routine match. But if something’s on your mind, talk with your veterinary team. They can help determine what’s going on and recommend the best next step.',
      type: 'multi',
      skippable: true,
      options: [
        { value: 'breath', label: 'Bad breath' },
        { value: 'tartar', label: 'Visible tartar' },
        { value: 'sensitivity', label: 'Mouth sensitivity' },
        { value: 'proactive', label: 'Nah, just being proactive', exclusive: true },
      ],
    },
  ];

  function petDisplay(name) {
    const finder = document.getElementById('fit-finder');
    if (finder && finder.getAttribute('data-fyf-pet-token') === '1') return '[Pet Name]';
    const n = (name || '').trim();
    return n || 'your pet';
  }

  function fillPet(str, name) {
    return String(str || '').replace(/\{\{pet\}\}/g, petDisplay(name));
  }

  /** Strategy scoring: coop caps routine; effort picks within ceiling; chews by affinity. */
  function scoreAnswers(a) {
    const coop = Number(a.coop);
    const effort = Number(a.effort);
    const treat = a.species === 'dog' ? Number(a.treat || 1) : 0;
    const routineId = MATRIX[coop - 1][effort - 1];
    const routine = ROUTINES[routineId];
    const primary = PRODUCTS[routine.primary];
    const secondary = routine.secondary ? PRODUCTS[routine.secondary] : null;
    let chews = null;
    let chewLabel = null;
    if (a.species === 'dog' && treat >= routine.chewMin) {
      chews = PRODUCTS.chews;
      chewLabel = routine.chewAs === 'readyStar' ? 'Ready for more?' : 'Added bonus';
    }
    // Effortless + chews: chews occupy secondary slot (no separate secondary product)
    const secondaryOut =
      routineId === 'effortless' && chews ? null : secondary;
    const showPowder = primary.id === 'water' || (secondaryOut && secondaryOut.id === 'water');
    return {
      routineId,
      routineName: routine.name,
      primary,
      secondary: secondaryOut,
      secondaryLabel: secondaryOut ? 'Ready for more?' : null,
      chews,
      chewLabel: chews ? (routineId === 'effortless' ? 'Ready for more?' : chewLabel) : null,
      showPowder,
      species: a.species,
      petName: (a.petName || '').trim(),
      current: a.current,
      concerns: a.concerns || [],
      coop,
      effort,
      treat,
    };
  }

  function encodeState(a) {
    const params = new URLSearchParams();
    params.set('fyf', '1');
    params.set('species', a.species);
    if (a.petName) params.set('pet', a.petName);
    params.set('coop', String(a.coop));
    params.set('effort', String(a.effort));
    if (a.species === 'dog' && a.treat != null) params.set('treat', String(a.treat));
    if (a.current) params.set('current', a.current);
    if (a.concerns && a.concerns.length) params.set('concerns', a.concerns.join(','));
    return params;
  }

  function decodeState(search) {
    const params = new URLSearchParams(search || location.search);
    if (params.get('fyf') !== '1') return null;
    const species = params.get('species');
    const coop = Number(params.get('coop'));
    const effort = Number(params.get('effort'));
    if (!species || !(coop >= 1 && coop <= 4) || !(effort >= 1 && effort <= 4)) return null;
    const treat = species === 'dog' ? Number(params.get('treat') || 1) : null;
    if (species === 'dog' && !(treat >= 1 && treat <= 4)) return null;
    return {
      species,
      petName: params.get('pet') || '',
      coop,
      effort,
      treat,
      current: params.get('current') || 'scratch',
      concerns: (params.get('concerns') || '').split(',').filter(Boolean),
    };
  }

  function writeUrl(a) {
    const params = encodeState(a);
    const url = `${location.pathname}?${params.toString()}${location.hash || ''}`;
    history.replaceState(null, '', url);
  }

  function clearUrl() {
    history.replaceState(null, '', location.pathname + (location.hash || ''));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Match build.mjs: superscript ® in text nodes only (JS-injected HTML skips the build pass).
  function superscriptMarks(html) {
    let skip = 0;
    return String(html)
      .split(/(<[^>]*>)/)
      .map((part) => {
        if (part.startsWith('<')) {
          const m = part.match(/^<(\/?)(title|script|style|textarea|option|sup|svg)\b/i);
          if (m) skip = Math.max(0, skip + (m[1] ? -1 : 1));
          return part;
        }
        return skip ? part : part.replace(/®|&reg;/g, '<sup>®</sup>');
      })
      .join('');
  }

  function questionList(answers) {
    return QUESTIONS.filter((q) => !q.dogsOnly || answers.species === 'dog');
  }

  const HERO_EMAIL = {
    effortless: 'hero-email-keepiteffortless.jpg',
    makeItQuick: 'hero-email-makeitquick.jpg',
    getHandsOn: 'hero-email-gethandson.jpg',
    readyForMore: 'hero-email-readyformore.jpg',
  };

  function sampleAnswersForRoutine(routineId, species) {
    const sp = species || 'dog';
    for (let coop = 1; coop <= 4; coop++) {
      for (let effort = 1; effort <= 4; effort++) {
        if (MATRIX[coop - 1][effort - 1] !== routineId) continue;
        return {
          species: sp,
          petName: '[Pet Name]',
          coop,
          effort,
          treat: sp === 'dog' ? 4 : null,
          current: 'scratch',
          concerns: [],
        };
      }
    }
    return {
      species: sp,
      petName: '[Pet Name]',
      coop: 1,
      effort: 1,
      treat: sp === 'dog' ? 4 : null,
      current: 'scratch',
      concerns: [],
    };
  }

  function proofCardLabelHtml(label) {
    const optional = /\s*\(optional\)\s*$/i;
    if (optional.test(label)) {
      const main = label.replace(optional, '').trim();
      return `<p class="fyf-card__label is-split"><span class="fyf-card__label-main">${escapeHtml(main)}</span><span class="fyf-card__label-opt">(optional)</span></p>`;
    }
    return `<p class="fyf-card__label"><span class="fyf-card__label-main">${escapeHtml(label)}</span></p>`;
  }

  /** Desktop results card markup for proof dump (no offer email — that lives in the standalone email section). */
  function proofProductHtml(product, label, pet, assetRoot) {
    if (!product) return '';
    const blurb = product.blurb ? `<p class="fyf-card__blurb">${escapeHtml(product.blurb(pet))}</p>` : '';
    const detail = product.detail ? `<p class="fyf-card__detail">${escapeHtml(product.detail)}</p>` : '';
    return `<article class="fyf-card">
      ${proofCardLabelHtml(label)}
      <div class="fyf-card__row">
        <img class="fyf-card__sticker" src="${assetRoot}assets/img/${product.sticker}" alt="" width="120" height="120">
        <div class="fyf-card__copy">
          <h3 class="fyf-card__name">VETRADENT® ${escapeHtml(product.name)}</h3>
          ${blurb}
          ${detail}
        </div>
      </div>
    </article>`;
  }

  function renderProofDump(container, opts) {
    if (!container) return;
    const assetRoot = (opts && opts.assetRoot) || '../../';
    const introHtml = (opts && opts.introHtml) || '';
    const pet = '[Pet Name]';

    const questionsHtml = QUESTIONS.map((q, i) => {
      const dogs = q.dogsOnly ? ' <em>(dogs only)</em>' : '';
      const optsList = (q.options || [])
        .map((o) => `<li>${escapeHtml(o.label)}${o.exclusive ? ' <em>(exclusive)</em>' : ''}</li>`)
        .join('');
      return `<li class="proof-fyf__q">
        <p class="proof-fyf__label">Question ${i + 1}${dogs}</p>
        <p>${escapeHtml(q.kicker || '')}</p>
        <h3>${escapeHtml(fillPet(q.title, pet))}</h3>
        <p>${escapeHtml(fillPet(q.help || '', pet))}</p>
        ${optsList ? `<ul class="proof-fyf__options">${optsList}</ul>` : ''}
        ${q.type === 'text' ? '<p class="proof-fyf__note">Free-text pet name field</p>' : ''}
        ${q.skippable ? '<p class="proof-fyf__note">Skippable</p>' : ''}
      </li>`;
    }).join('');

    // Desktop page designs per routine — emails are proofed only in the standalone Offer email section
    const routineBlocks = Object.keys(ROUTINES)
      .map((id) => {
        const dog = scoreAnswers(sampleAnswersForRoutine(id, 'dog'));
        const cat = scoreAnswers(sampleAnswersForRoutine(id, 'cat'));
        const products = [
          proofProductHtml(dog.primary, 'Start here', pet, assetRoot),
          dog.secondary
            ? proofProductHtml(dog.secondary, (dog.secondaryLabel || 'Ready for more?') + ' (optional)', pet, assetRoot)
            : '',
          dog.chews
            ? proofProductHtml(dog.chews, (dog.chewLabel || 'Added bonus') + ' (optional)', pet, assetRoot)
            : '',
        ].join('');
        return `<section class="proof-fyf__block proof-fyf__block--results">
          <p class="proof-fyf__label">Results — ${escapeHtml(dog.routineName)} (desktop · dog sample)</p>
          <h3 class="proof-fyf__routine">${escapeHtml(dog.routineName)}</h3>
          <p class="proof-fyf__note">Sample answers: coop ${dog.coop}, effort ${dog.effort}, treat ${dog.treat}; pet token [Pet Name]</p>
          <div class="fyf-results__products proof-fyf__products">${products}</div>
          <p class="proof-fyf__note">Cat sample for same routine: primary VETRADENT® ${escapeHtml(cat.primary.name)}${cat.secondary ? `; secondary ${escapeHtml(cat.secondary.name)}` : ''}${cat.chews ? '' : '; no chews (dogs only)'}.</p>
        </section>`;
      })
      .join('');

    const offerFormNote = `<section class="proof-fyf__block">
      <p class="proof-fyf__label">Offer / unlock form (copy)</p>
      <h3>Unlock your discount — ${DISCOUNT} Off &amp; start your routine</h3>
      <p>Get an exclusive VETRADENT® discount code, good on Amazon and Chewy. We’ll also send a link to your personalized dental recommendations for future reference.</p>
      <p class="proof-fyf__note">Fields: First Name*, Last Name*, Email*, Phone (optional), opt-in checkbox. CTA: Get My Offer. Code shown after unlock: ${OFFER_CODE}.</p>
      <p class="proof-fyf__note">Thanks state: “Thanks for using our Fit Finder!” + email confirmation + discount unlocked copy.</p>
      <p class="proof-fyf__note">Offer email markup is proofed only in the “Quiz — Offer email (600px)” section below.</p>
    </section>`;

    container.innerHTML = superscriptMarks(`
      <div class="proof-fyf">
        <section class="proof-fyf__block">
          <p class="proof-fyf__label">Intro</p>
          ${introHtml || '<h2>Find a doable dental care routine for you and your pet</h2>'}
        </section>
        <section class="proof-fyf__block">
          <p class="proof-fyf__label">Loading</p>
          <h3>Finding your match…</h3>
          <p>One second while we put together your routine.</p>
        </section>
        <section class="proof-fyf__block">
          <p class="proof-fyf__label">All quiz questions</p>
          <ul class="proof-fyf__q-list">${questionsHtml}</ul>
        </section>
        ${routineBlocks}
        ${offerFormNote}
      </div>
    `);
    container.removeAttribute('hidden');
    container.hidden = false;
  }

  // Expose scoring for smoke tests + proof dump
  window.vdFitFinder = {
    scoreAnswers,
    encodeState,
    decodeState,
    MATRIX,
    ROUTINES,
    PRODUCTS,
    QUESTIONS,
    renderProofDump,
  };

  function init(root) {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    const assetRoot = root.dataset.root || '../../';
    const productsHref = root.dataset.products || `${assetRoot}pet-owner/products/index.html`;
    const privacyHref = root.dataset.privacy || `${assetRoot}privacy-policy/index.html`;

    const state = {
      phase: 'intro', // intro | quiz | loading | results | thanks
      view: root.getAttribute('data-fyf-view') || 'form', // form | email-results
      step: 0,
      answers: {
        species: null,
        petName: '',
        coop: null,
        current: null,
        effort: null,
        treat: null,
        concerns: [],
      },
      result: null,
      lead: null,
    };

    const restored = decodeState();
    if (restored) {
      Object.assign(state.answers, restored);
      state.result = scoreAnswers(state.answers);
      state.phase = 'results';
    }

    const els = {
      intro: root.querySelector('[data-fyf="intro"]'),
      quiz: root.querySelector('[data-fyf="quiz"]'),
      loading: root.querySelector('[data-fyf="loading"]'),
      results: root.querySelector('[data-fyf="results"]'),
      emailPreview: root.querySelector('[data-fyf="email-preview"]'),
      emailBody: root.querySelector('[data-fyf-email-body]'),
    };

    function isUnlocked() {
      return state.view === 'email-results';
    }

    function setView(view) {
      if (view !== 'form' && view !== 'email-results') return;
      state.view = view;
      root.setAttribute('data-fyf-view', view);
      if (state.result && (state.phase === 'results' || state.phase === 'thanks')) {
        renderResults();
      }
    }

    function applyPageView(view) {
      setView(view);
      const apply = () => {
        const dock = document.querySelector('page-states[target="#fit-finder"]');
        if (!dock) return;
        if (typeof dock.select === 'function') {
          dock.select(view);
          return;
        }
        const btn = dock.shadowRoot && dock.shadowRoot.querySelector(`[data-state-id="${view}"]`);
        if (btn) btn.click();
      };
      if (customElements.get('page-states')) apply();
      else customElements.whenDefined('page-states').then(apply);
    }

    function syncDocumentMeta(phase) {
      const meta = document.querySelector('meta[name="description"]');
      const onResults = phase === 'results' || phase === 'thanks';
      const title = onResults
        ? root.getAttribute('data-results-title')
        : root.getAttribute('data-intro-title');
      const description = onResults
        ? root.getAttribute('data-results-description')
        : root.getAttribute('data-intro-description');
      const page = onResults
        ? root.getAttribute('data-results-page')
        : root.getAttribute('data-intro-page');
      if (title) document.title = title;
      if (description && meta) meta.setAttribute('content', description);
      if (page) document.documentElement.setAttribute('data-page', page);
      document.dispatchEvent(new CustomEvent('vd:page-meta', { bubbles: true }));
    }

    function prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    let quizSwapTimer = 0;

    function clearQuizMotion() {
      if (quizSwapTimer) {
        window.clearTimeout(quizSwapTimer);
        quizSwapTimer = 0;
      }
      if (els.quiz) els.quiz.classList.remove('is-entering', 'is-stepping', 'is-exiting');
      if (els.intro) els.intro.classList.remove('is-leaving');
    }

    function showPhase(phase) {
      state.phase = phase;
      root.dataset.phase = phase;
      ['intro', 'quiz', 'loading', 'results'].forEach((key) => {
        const el = els[key];
        if (!el) return;
        const on = key === phase || (phase === 'thanks' && key === 'results');
        el.hidden = !on;
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      syncDocumentMeta(phase);
    }

    function startQuiz() {
      state.step = 0;
      state.answers = {
        species: null,
        petName: '',
        coop: null,
        current: null,
        effort: null,
        treat: null,
        concerns: [],
      };
      state.result = null;
      state.lead = null;
      clearUrl();
      clearQuizMotion();

      const enterQuiz = () => {
        renderQuiz();
        showPhase('quiz');
        if (!prefersReducedMotion() && els.quiz) {
          void els.quiz.offsetWidth;
          els.quiz.classList.add('is-entering');
        }
      };

      if (!prefersReducedMotion() && els.intro && state.phase === 'intro' && !els.intro.hidden) {
        els.intro.classList.add('is-leaving');
        quizSwapTimer = window.setTimeout(() => {
          quizSwapTimer = 0;
          els.intro.classList.remove('is-leaving');
          enterQuiz();
        }, 200);
      } else {
        enterQuiz();
      }
    }

    function renderQuiz() {
      const qs = questionList(state.answers);
      const q = qs[state.step];
      if (!q) return finishQuiz();
      const total = qs.length;
      const pet = petDisplay(state.answers.petName);
      const progress = ((state.step + 1) / total) * 100;

      let body = '';
      if (q.type === 'text') {
        body = `<div class="fyf-field">
          <label class="screen-reader-text" for="fyf-pet-name">${escapeHtml(q.placeholder || 'Pet name')}</label>
          <input id="fyf-pet-name" class="fyf-input" type="text" maxlength="40" autocomplete="off" placeholder="${escapeHtml(q.placeholder || '')}" value="${escapeHtml(state.answers.petName || '')}">
          <button type="button" class="wp-block-button__link fyf-continue" data-fyf-continue>Continue</button>
        </div>`;
      } else if (q.type === 'multi') {
        const selected = new Set(state.answers.concerns || []);
        body = `<div class="fyf-options is-multi" role="group" aria-label="${escapeHtml(fillPet(q.title, state.answers.petName))}">
          ${q.options
            .map(
              (o) => `<button type="button" class="fyf-option${selected.has(o.value) ? ' is-selected' : ''}" data-fyf-multi="${escapeHtml(o.value)}" data-exclusive="${o.exclusive ? '1' : '0'}" aria-pressed="${selected.has(o.value) ? 'true' : 'false'}">${escapeHtml(o.label)}</button>`
            )
            .join('')}
        </div>
        <div class="fyf-multi-actions">
          <button type="button" class="fyf-link" data-fyf-skip>Skip this one</button>
          <button type="button" class="wp-block-button__link fyf-continue" data-fyf-continue>See my routine</button>
        </div>`;
      } else {
        body = `<div class="fyf-options" role="list">
          ${q.options
            .map((o) => {
              const icon = o.icon
                ? `<img class="fyf-option__icon" src="${assetRoot}assets/img/${o.icon}" alt="" width="40" height="40">`
                : '';
              return `<button type="button" class="fyf-option" data-fyf-choice="${escapeHtml(String(o.value))}" role="listitem">${icon}<span>${escapeHtml(o.label)}</span></button>`;
            })
            .join('')}
        </div>`;
      }

      els.quiz.innerHTML = superscriptMarks(`
        <div class="fyf-progress" aria-label="Step ${state.step + 1} of ${total}">
          <p class="fyf-progress__label">Step ${state.step + 1} of ${total}</p>
          <div class="fyf-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><i style="width:${progress}%"></i></div>
        </div>
        <p class="fyf-kicker">${escapeHtml(q.kicker)}</p>
        <h2 class="fyf-question">${escapeHtml(fillPet(q.title, state.answers.petName))}</h2>
        <p class="fyf-help">${escapeHtml(fillPet(q.help, state.answers.petName))}</p>
        ${body}
        ${q.tip ? `<p class="fyf-tip"><strong>Doable Tip:</strong> ${escapeHtml(q.tip)}</p>` : ''}
        <button type="button" class="fyf-back"${state.step === 0 ? ' disabled' : ''}>← Back</button>
      `);
    }

    function swapQuizStep() {
      if (prefersReducedMotion() || !els.quiz || els.quiz.hidden) {
        renderQuiz();
        return;
      }
      if (quizSwapTimer) {
        window.clearTimeout(quizSwapTimer);
        quizSwapTimer = 0;
      }
      els.quiz.classList.remove('is-entering', 'is-stepping');
      els.quiz.classList.add('is-exiting');
      quizSwapTimer = window.setTimeout(() => {
        quizSwapTimer = 0;
        renderQuiz();
        els.quiz.classList.remove('is-exiting');
        void els.quiz.offsetWidth;
        els.quiz.classList.add('is-stepping');
      }, 150);
    }

    function advanceFromChoice(value) {
      const qs = questionList(state.answers);
      const q = qs[state.step];
      if (q.id === 'species') {
        state.answers.species = value;
        if (value !== 'dog') state.answers.treat = null;
      } else if (q.id === 'coop') state.answers.coop = Number(value);
      else if (q.id === 'current') state.answers.current = value;
      else if (q.id === 'effort') state.answers.effort = Number(value);
      else if (q.id === 'treat') state.answers.treat = Number(value);
      state.step += 1;
      if (state.step >= questionList(state.answers).length) finishQuiz();
      else swapQuizStep();
    }

    function continueText() {
      const input = els.quiz.querySelector('#fyf-pet-name');
      const name = (input && input.value.trim()) || '';
      if (!name) {
        if (input) {
          input.setCustomValidity('Please enter a name (nicknames welcome).');
          input.reportValidity();
          input.setCustomValidity('');
        }
        return;
      }
      state.answers.petName = name;
      state.step += 1;
      swapQuizStep();
    }

    function toggleMulti(btn) {
      const value = btn.getAttribute('data-fyf-multi');
      const exclusive = btn.getAttribute('data-exclusive') === '1';
      let selected = new Set(state.answers.concerns || []);
      if (exclusive) {
        selected = selected.has(value) ? new Set() : new Set([value]);
      } else {
        selected.delete('proactive');
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
      }
      state.answers.concerns = [...selected];
      renderQuiz();
    }

    function finishQuiz() {
      applyPageView('form');
      showPhase('loading');
      state.result = scoreAnswers(state.answers);
      writeUrl(state.answers);
      window.setTimeout(() => {
        renderResults();
        showPhase('results');
        els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 900);
    }

    function cardLabelMark(label) {
      const t = String(label || '').toLowerCase();
      let file = '';
      let kind = '';
      if (t.includes('start here')) {
        file = 'art-double-arrow.svg';
        kind = 'is-arrows';
      } else if (t.includes('ready')) {
        file = 'art-expletives.svg';
        kind = 'is-expletives';
      } else if (t.includes('bonus')) {
        file = 'art-star-2.svg';
        kind = 'is-star';
      }
      if (!file) return '';
      return `<img class="fyf-card__mark ${kind}" src="${assetRoot}assets/img/${file}" alt="" width="64" height="40" aria-hidden="true">`;
    }

    function cardLabelHtml(label) {
      const markHtml = cardLabelMark(label);
      const optional = /\s*\(optional\)\s*$/i;
      if (optional.test(label)) {
        const main = label.replace(optional, '').trim();
        return `<p class="fyf-card__label is-split"><span class="fyf-card__label-main">${escapeHtml(main)}</span>${markHtml}<span class="fyf-card__label-opt">(optional)</span></p>`;
      }
      return `<p class="fyf-card__label"><span class="fyf-card__label-main">${escapeHtml(label)}</span>${markHtml}</p>`;
    }

    function productCard(product, label, opts) {
      if (!product) return '';
      const pet = petDisplay(state.answers.petName);
      const tier = opts && opts.tier ? opts.tier : 'primary';
      const isDog = state.answers.species === 'dog';
      const showVohc = isDog && product.vohc;
      let vohcBlock = '';
      if (showVohc) {
        const body =
          product.vohcBody ||
          'This product has the Veterinary Oral Health Council seal, which means it has been tested and proven to reduce tartar in dogs.*';
        const note = product.vohcNote || '*Achieved in dogs only.';
        vohcBlock = `<div class="fyf-vohc">
              <img class="fyf-card__vohc" src="${assetRoot}assets/img/logo-vohc-on-white.svg" alt="VOHC Accepted" width="64" height="64">
              <div class="fyf-vohc__text">
                <p class="fyf-vohc__body">${escapeHtml(body)}</p>
                <p class="fyf-vohc__note">${escapeHtml(note)}</p>
              </div>
            </div>`;
      }
      const powder =
        opts && opts.powder
          ? `<p class="fyf-powder">Have more pets at home? Try <a href="${productsHref}#product-powder">VETRADENT® Powder Water Additive</a>. It stretches budgets with more servings per package than the liquid.</p>`
          : '';
      const detail = product.detail ? `<p class="fyf-card__detail">${escapeHtml(product.detail)}</p>` : '';
      const blurbFn =
        tier === 'secondary' && typeof product.blurbSecondary === 'function'
          ? product.blurbSecondary
          : product.blurb;
      const blurb = blurbFn ? `<p class="fyf-card__blurb">${escapeHtml(blurbFn(pet))}</p>` : '';
      const nameSuffix = product.nameSuffix
        ? ` <span class="fyf-card__name-suffix">${escapeHtml(product.nameSuffix)}</span>`
        : '';
      const buy = isUnlocked()
        ? `<div class="fyf-buy">
              <a class="fyf-buy__link" href="${escapeHtml(product.amazon)}" target="_blank" rel="noopener noreferrer">Amazon</a>
              <a class="fyf-buy__link" href="${escapeHtml(product.chewy)}" target="_blank" rel="noopener noreferrer">Chewy</a>
            </div>`
        : '';
      return `<article class="fyf-card is-${tier}">
        ${cardLabelHtml(label)}
        <div class="fyf-card__row">
          <img class="fyf-card__sticker" src="${assetRoot}assets/img/${product.sticker}" alt="" loading="lazy" width="120" height="120">
          <div class="fyf-card__copy">
            <h3 class="fyf-card__name">VETRADENT® ${escapeHtml(product.name)}${nameSuffix}</h3>
            ${blurb}
            ${detail}
            ${powder}
            ${vohcBlock}
          </div>
        </div>
        ${buy}
      </article>`;
    }

    function offerAside(r) {
      if (isUnlocked()) {
        return `<section class="fyf-offer is-unlocked" aria-labelledby="fyf-offer-title" data-fyf-offer>
              <button type="button" class="fyf-offer__toggle" data-fyf-offer-toggle aria-expanded="false" aria-controls="fyf-offer-panel">
                <span class="fyf-offer__toggle-copy is-unlocked-copy">
                  <span class="fyf-offer__toggle-stack">
                    <span class="fyf-offer__toggle-eyebrow">Discount Code</span>
                    <span class="fyf-offer__toggle-save">Save ${DISCOUNT}</span>
                  </span>
                  <span class="fyf-offer__toggle-code">${OFFER_CODE}</span>
                </span>
                <span class="fyf-offer__nudge" aria-hidden="true">
                  <span class="fyf-offer__nudge-btn">
                    <svg class="fyf-offer__nudge-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4v12.5M7.5 12.5 12 17l4.5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
              <div class="fyf-offer__backdrop" data-fyf-offer-backdrop hidden></div>
              <div class="fyf-offer__panel" id="fyf-offer-panel">
                <h3 id="fyf-offer-title" class="fyf-offer__title">
                  <span class="fyf-offer__discount">Save ${DISCOUNT}</span>
                  <span class="fyf-offer__sub">on a personalized dental routine for you and ${escapeHtml(petDisplay(r.petName))}.</span>
                </h3>
                <p class="fyf-offer__lead">Claim your discount with offer code:</p>
                <p class="fyf-offer__code"><span>${OFFER_CODE}</span></p>
                <p class="fyf-offer__lead">Review your Real Doable Dental routine from VETRADENT® — then shop your match.</p>
                <div class="fyf-buy fyf-offer__buy">
                  <a class="fyf-buy__link" href="${escapeHtml(r.primary.amazon)}" target="_blank" rel="noopener noreferrer">Shop Amazon</a>
                  <a class="fyf-buy__link" href="${escapeHtml(r.primary.chewy)}" target="_blank" rel="noopener noreferrer">Shop Chewy</a>
                </div>
              </div>
            </section>`;
      }
      if (state.lead) {
        return `<section class="fyf-offer is-thanks is-expanded" aria-labelledby="fyf-thanks-title" data-fyf-offer>
              <button type="button" class="fyf-offer__toggle" data-fyf-offer-toggle aria-expanded="true" aria-controls="fyf-offer-panel">
                <span class="fyf-offer__toggle-copy">
                  <span class="fyf-offer__toggle-eyebrow">Offer</span>
                  <span class="fyf-offer__toggle-label">Email Sent!</span>
                </span>
                <span class="fyf-offer__nudge" aria-hidden="true">
                  <span class="fyf-offer__nudge-btn">
                    <svg class="fyf-offer__nudge-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4v12.5M7.5 12.5 12 17l4.5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
              <div class="fyf-offer__backdrop" data-fyf-offer-backdrop></div>
              <div class="fyf-offer__panel" id="fyf-offer-panel">
                <div class="fyf-thanks__body">
                  <p class="fyf-thanks__bar">Premium Home Dental Care</p>
                  <img class="fyf-thanks__logo" src="${assetRoot}assets/img/logo-vetradent-dechra-brand-purple.svg" alt="VETRADENT® — A Dechra Brand" width="200" height="56">
                  <h2 id="fyf-thanks-title" class="fyf-thanks__title">Thanks for using our Fit Finder!</h2>
                  <p>We’ve sent an email to <strong data-fyf-email>${escapeHtml(state.lead.email || '')}</strong> with your discount code and a link to your personalized Real Doable Dental routine.</p>
                  <img class="fyf-thanks__dechra" src="${assetRoot}assets/img/logo-dechra-vrt.svg" alt="Dechra" width="240" height="100">
                </div>
              </div>
            </section>`;
      }
      return `<section class="fyf-offer" aria-labelledby="fyf-offer-title" data-fyf-offer>
              <button type="button" class="fyf-offer__toggle" data-fyf-offer-toggle aria-expanded="false" aria-controls="fyf-offer-panel">
                <span class="fyf-offer__toggle-copy">
                  <span class="fyf-offer__toggle-eyebrow">Offer</span>
                  <span class="fyf-offer__toggle-label">Unlock ${DISCOUNT} Off!</span>
                </span>
                <span class="fyf-offer__nudge" aria-hidden="true">
                  <span class="fyf-offer__nudge-btn">
                    <svg class="fyf-offer__nudge-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4v12.5M7.5 12.5 12 17l4.5-4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </span>
              </button>
              <div class="fyf-offer__backdrop" data-fyf-offer-backdrop hidden></div>
              <div class="fyf-offer__panel" id="fyf-offer-panel">
                <h3 id="fyf-offer-title" class="fyf-offer__title">
                  <span class="fyf-offer__eyebrow">Unlock your discount</span>
                  <span class="fyf-offer__discount">${DISCOUNT} Off</span>
                  <span class="fyf-offer__sub">&amp; start your routine</span>
                </h3>
                <p class="fyf-offer__lead">Get an exclusive VETRADENT® discount code, good on Amazon and Chewy. We’ll also send a link to your personalized dental recommendations for future reference.</p>
                <form class="vd-form fyf-form" novalidate>
                  <div class="vd-field"><input id="fyf-first" name="first_name" type="text" autocomplete="given-name" placeholder=" " required><label for="fyf-first">First Name*</label></div>
                  <div class="vd-field"><input id="fyf-last" name="last_name" type="text" autocomplete="family-name" placeholder=" " required><label for="fyf-last">Last Name*</label></div>
                  <div class="vd-field is-full"><input id="fyf-email" name="email" type="email" autocomplete="email" placeholder=" " required><label for="fyf-email">Email*</label></div>
                  <div class="vd-field is-full"><input id="fyf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder=" " pattern="^(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}$" title="Enter a valid 10-digit phone number"><label for="fyf-phone">Phone (optional)</label></div>
                  <div class="fyf-optin is-full">
                    <label><input type="checkbox" name="opt_in" required> Opt me in to receive Dechra email communications.</label>
                  </div>
                  <div class="wp-block-buttons is-full">
                    <div class="wp-block-button is-shimmer"><button class="wp-block-button__link" type="submit">Get My Offer</button></div>
                  </div>
                  <p class="fyf-legal is-full">By submitting, you agree to receive marketing emails from VETRADENT®. You can unsubscribe at any time using the link in any email. Your information will be handled in accordance with Dechra’s <a href="${privacyHref}">Privacy Policy</a>.</p>
                </form>
              </div>
            </section>`;
    }

    function setOfferExpanded(offer, expanded) {
      if (!offer) return;
      offer.classList.toggle('is-expanded', expanded);
      const toggle = offer.querySelector('[data-fyf-offer-toggle]');
      const backdrop = offer.querySelector('[data-fyf-offer-backdrop]');
      if (toggle) toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (backdrop) backdrop.hidden = !expanded;
    }

    function tapePhrase(text) {
      const item = `<span>${escapeHtml(text)}</span><i>★</i>`;
      return item.repeat(8);
    }

    function renderResults() {
      const r = state.result;
      const pet = petDisplay(r.petName);
      const speciesIcon = r.species === 'cat' ? 'icon-cat.svg' : 'icon-dog.svg';
      const speciesLabel = r.species === 'cat' ? 'Cat' : 'Dog';
      els.results.innerHTML = superscriptMarks(`
        <header class="fyf-results__hero" data-species="${escapeHtml(r.species || 'dog')}">
          <div class="fyf-results__hero-bg" aria-hidden="true">
            <img class="fyf-results__species vd-float" src="${assetRoot}assets/img/${speciesIcon}" alt="" width="180" height="180">
            <div class="fyf-results__veil"></div>
          </div>
          <div class="fyf-results__hero-copy">
            <p class="fyf-kicker">Your Personalized VETRADENT® Dental Care Routine</p>
            <h2 class="fyf-results__title">Here’s what’s doable for <span class="fyf-results__title-pet">you and ${escapeHtml(pet)}</span> right now</h2>
          </div>
          <div class="fyf-hero-tapes" aria-hidden="true">
            <div class="fyf-hero-tape is-front">
              <div class="fyf-hero-tape__track">
                ${tapePhrase(r.routineName)}
              </div>
            </div>
          </div>
          <span class="screen-reader-text">${escapeHtml(speciesLabel)} routine: ${escapeHtml(r.routineName)}</span>
        </header>
        <div class="fyf-results__layout">
          <div class="fyf-results__products">
            ${productCard(r.primary, 'Start here', { tier: 'primary', powder: r.showPowder && r.primary.id === 'water' })}
            ${r.secondary ? productCard(r.secondary, r.secondaryLabel + ' (optional)', { tier: 'secondary', powder: r.showPowder && r.secondary.id === 'water' }) : ''}
            ${r.chews ? productCard(r.chews, r.chewLabel + ' (optional)', { tier: 'bonus' }) : ''}
            <div class="fyf-biotrate" aria-label="Biotrate Technology">
              <img class="fyf-biotrate__logo" src="${assetRoot}assets/img/logo-biotrate.svg" alt="Biotrate®" width="180" height="60">
              <div class="fyf-biotrate__copy">
                <p>Every VETRADENT® product is uniquely powered by Biotrate® Technology to help reduce plaque and tartar and freshen breath.</p>
                <button type="button" class="fyf-link" data-open-dialog="dlg-biotrate" aria-haspopup="dialog">Learn more</button>
              </div>
            </div>
          </div>
          <aside class="fyf-results__aside">
            ${offerAside(r)}
          </aside>
        </div>
        <div class="fyf-results__actions">
          <button type="button" class="fyf-ghost" data-fyf-restart>Find a New Match</button>
          <a class="fyf-ghost" href="${productsHref}">Browse Full Portfolio</a>
        </div>
        <p class="fyf-vet">Regular dental check-ups can help identify concerns early. Talk with your veterinary team about your pet’s oral health and when a professional cleaning may be appropriate.</p>
      `);
      renderEmailPreview();
    }

    function renderEmailPreview() {
      if (!els.emailBody) return;
      const r = state.result;
      if (!r) {
        els.emailBody.innerHTML = `<p class="fyf-email-preview__empty">Complete the Fit Finder to preview the offer email.</p>`;
        return;
      }
      const heroFile = HERO_EMAIL[r.routineId] || HERO_EMAIL.effortless;
      els.emailBody.innerHTML = superscriptMarks(`
        <article class="fyf-mail" aria-labelledby="fyf-email-preview-title">
          <div class="fyf-mail__brand">
            <img src="${assetRoot}assets/img/logo-dechra-vrt.svg" alt="Dechra" width="192" height="140">
          </div>
          <img class="fyf-mail__hero" src="${assetRoot}assets/img/${heroFile}" alt="VETRADENT® Real Doable Dental. ${escapeHtml(r.routineName)}. Premium Home Dental Care." width="1200" height="1080">
          <div class="fyf-mail__body">
            <section class="fyf-mail__offer">
              <p class="fyf-mail__offer-flag">Limited-time offer</p>
              <h2 id="fyf-email-preview-title" class="fyf-mail__headline">Save ${DISCOUNT} on your personalized dental routine.</h2>
              <p class="fyf-mail__copy">Give [Pet-Name] cleaner teeth and fresher breath for less. Your Real Doable Dental routine starts here.</p>
              <p class="fyf-mail__code">USE CODE: <strong>${OFFER_CODE}</strong></p>
              <div class="fyf-mail__cta">
                <a href="${escapeHtml(r.primary.amazon)}" target="_blank" rel="noopener noreferrer">Shop Amazon</a>
                <a href="${escapeHtml(r.primary.chewy)}" target="_blank" rel="noopener noreferrer">Shop Chewy</a>
              </div>
            </section>
            <section class="fyf-mail__next">
            <h3 class="fyf-mail__subhead">Thanks for using our Fit Finder!</h3>
            <p class="fyf-mail__copy">You can refer to your dental routine recommendations anytime. Based on your answers, we’ve created a doable VETRADENT® dental routine that meets you and your pet where you&nbsp;are&nbsp;now.</p>
            <p class="fyf-mail__cheer">⭐ You can do this! ⭐</p>
            <p class="fyf-mail__copy">Think progress over perfection to improve your pet’s dental&nbsp;health.</p>
            <p class="fyf-mail__review"><a href="#">Review your results</a></p>
            <ul class="fyf-mail__callouts">
              <li>
                <div class="fyf-mail__callout-art">
                  <img src="${assetRoot}assets/img/icon-flask.svg" alt="" width="48" height="48">
                </div>
                <strong>BIOTRATE® TECHNOLOGY</strong>
                <span>Patented science behind every&nbsp;smile</span>
              </li>
              <li>
                <div class="fyf-mail__callout-art">
                  <img src="${assetRoot}assets/img/icon-stack.svg" alt="" width="48" height="48">
                </div>
                <strong>FLEXIBLE FORMATS</strong>
                <span>Made for real-life&nbsp;routines</span>
              </li>
              <li>
                <div class="fyf-mail__callout-art">
                  <img src="${assetRoot}assets/img/icon-tooth.svg" alt="" width="48" height="48">
                </div>
                <strong>REAL RESULTS</strong>
                <span>Control tartar &amp; freshen&nbsp;breath</span>
              </li>
            </ul>
            <p class="fyf-mail__note">*Achieved in dogs only. VETRADENT® Water Additive was achieved with once monthly brushing in accordance with the study&nbsp;design.</p>
            </section>
          </div>
          <footer class="fyf-mail__footer">
            <img src="${assetRoot}assets/img/logo-dechra-vrt.svg" alt="Dechra" width="192" height="140">
            <p>© 2026 Dechra Veterinary Products, LLC. All rights reserved. Dechra is a registered trademark of Dechra Pharmaceuticals Limited. VETRADENT and Biotrate are registered trademarks of Dechra Veterinary Products, LLC. All other trademarks are trademarks of their respective owners.</p>
            <p>One Marina Park Drive, Suite 1300, Boston, MA 02210</p>
            <p class="fyf-mail__unsub"><a href="#">Unsubscribe</a> <span aria-hidden="true">|</span> <a href="#">Update Subscription Preferences</a></p>
            <p class="fyf-mail__code-line">M-00000 0000</p>
          </footer>
        </article>
      `);
    }

    function openEmailPreview() {
      renderEmailPreview();
      if (!els.emailPreview) return;
      if (typeof els.emailPreview.showModal === 'function' && !els.emailPreview.open) {
        els.emailPreview.showModal();
      }
    }

    function buildPardotPayload(form) {
      const r = state.result;
      const fd = new FormData(form);
      const payload = {
        first_name: fd.get('first_name'),
        last_name: fd.get('last_name'),
        email: fd.get('email'),
        phone: fd.get('phone') || '',
        opt_in: !!fd.get('opt_in'),
        pet_name: r.petName,
        recommended_product: r.primary.id,
        recommended_product_amazon_url: r.primary.amazon,
        recommended_product_chewy_url: r.primary.chewy,
        secondary_product: r.secondary ? r.secondary.id : '',
        secondary_product_amazon_url: r.secondary ? r.secondary.amazon : '',
        secondary_product_chewy_url: r.secondary ? r.secondary.chewy : '',
        tertiary_product: r.chews ? r.chews.id : '',
        tertiary_product_amazon_url: r.chews ? r.chews.amazon : '',
        tertiary_product_chewy_url: r.chews ? r.chews.chewy : '',
        discount_code: OFFER_CODE,
        // Deferred: POST to Pardot. Mock only for now.
        _deferred: ['pardot', 'offer_email', 'email_landing'],
      };
      return payload;
    }

    function openThanks(email) {
      state.lead = { email };
      showPhase('thanks');
      renderResults();
    }

    root.addEventListener('click', (e) => {
      const start = e.target.closest('[data-fyf-start]');
      if (start) {
        e.preventDefault();
        startQuiz();
        return;
      }
      const choice = e.target.closest('[data-fyf-choice]');
      if (choice && state.phase === 'quiz') {
        advanceFromChoice(choice.getAttribute('data-fyf-choice'));
        return;
      }
      const multi = e.target.closest('[data-fyf-multi]');
      if (multi && state.phase === 'quiz') {
        toggleMulti(multi);
        return;
      }
      if (e.target.closest('[data-fyf-continue]') && state.phase === 'quiz') {
        const qs = questionList(state.answers);
        const q = qs[state.step];
        if (q.type === 'text') continueText();
        else if (q.type === 'multi') finishQuiz();
        return;
      }
      if (e.target.closest('[data-fyf-skip]') && state.phase === 'quiz') {
        state.answers.concerns = [];
        finishQuiz();
        return;
      }
      if (e.target.closest('.fyf-back') && state.phase === 'quiz') {
        if (state.step > 0) {
          state.step -= 1;
          swapQuizStep();
        } else {
          clearQuizMotion();
          showPhase('intro');
        }
        return;
      }
      if (e.target.closest('[data-fyf-restart]')) {
        startQuiz();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const offerToggle = e.target.closest('[data-fyf-offer-toggle]');
      if (offerToggle) {
        const offer = offerToggle.closest('[data-fyf-offer]');
        if (offer) setOfferExpanded(offer, !offer.classList.contains('is-expanded'));
        return;
      }
      if (e.target.closest('[data-fyf-offer-backdrop]')) {
        const offer = e.target.closest('[data-fyf-offer]');
        if (offer) setOfferExpanded(offer, false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const offer = root.querySelector('.fyf-offer.is-expanded');
      if (offer) setOfferExpanded(offer, false);
    });

    root.addEventListener('submit', (e) => {
      const form = e.target.closest('.fyf-form');
      if (!form) return;
      e.preventDefault();
      const phone = form.querySelector('#fyf-phone');
      if (phone) {
        const raw = String(phone.value || '').trim();
        if (raw) {
          const digits = raw.replace(/\D/g, '');
          const ok =
            digits.length === 10 || (digits.length === 11 && digits.charAt(0) === '1');
          phone.setCustomValidity(ok ? '' : 'Enter a valid 10-digit phone number.');
        } else {
          phone.setCustomValidity('');
        }
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        if (phone) phone.setCustomValidity('');
        return;
      }
      if (phone) phone.setCustomValidity('');
      const payload = buildPardotPayload(form);
      try {
        localStorage.setItem('vd_fit_finder_lead', JSON.stringify({ ...payload, savedAt: Date.now() }));
      } catch (_) {}
      // eslint-disable-next-line no-console
      console.info('[Fit Finder] Lead payload (Pardot deferred)', payload);
      openThanks(payload.email);
    });

    document.addEventListener('vd:page-state', (e) => {
      const id = e.detail && e.detail.id;
      if (id === 'form' || id === 'email-results') setView(id);
    });
    document.addEventListener('vd:page-action', (e) => {
      const id = e.detail && e.detail.id;
      if (id === 'email') openEmailPreview();
      if (id === 'pet-name') {
        const on = !!(e.detail && e.detail.on);
        root.setAttribute('data-fyf-pet-token', on ? '1' : '0');
        if (state.result && (state.phase === 'results' || state.phase === 'thanks')) {
          renderResults();
        } else if (state.phase === 'quiz') {
          renderQuiz();
        }
      }
    });

    // Sync from page-states attribute if already applied
    const initialView = root.getAttribute('data-fyf-view') || root.getAttribute('data-state');
    if (initialView === 'form' || initialView === 'email-results') state.view = initialView;

    if (state.phase === 'results') {
      applyPageView('form');
      renderResults();
      showPhase('results');
    } else {
      showPhase('intro');
    }
  }

  function boot() {
    // Proof pack / ?proof=1 uses renderProofDump instead of the interactive quiz.
    const html = typeof document !== 'undefined' ? document.documentElement : null;
    if (html && html.classList && html.classList.contains('proof')) return;
    document.querySelectorAll('#fit-finder, [data-slot="fit-finder-quiz"]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
