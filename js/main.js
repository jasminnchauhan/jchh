import { LANGS, SERVICES, projects, dict } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

/* ---------------------------------------------------------------- state */
let lang = 'en';
let ready = false;
let currentSection = 'work';
let activeSlug = projects[0].slug;
let openSlug = null;

const sections = { work: $('#work'), about: $('#about'), contact: $('#contact') };
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
const t = (key) => dict[lang][key] ?? dict.en[key] ?? key;

/* ---------------------------------------------------------------- routing helpers */
function parse(path) {
  const p = path.replace(/\/+$/, '') || '/';
  if (p.startsWith('/project/')) return { type: 'project', slug: p.split('/')[2] };
  if (p === '/about') return { type: 'section', id: 'about' };
  if (p === '/contact') return { type: 'section', id: 'contact' };
  return { type: 'section', id: 'work' };
}

const sectionPath = (id) => (id === 'work' ? '/' : `/${id}`);

/* ---------------------------------------------------------------- logo */
function buildLogo() {
  const holder = $('.logo-text');

  [...'J/CHH'].forEach((c, i) => {
    const ch = document.createElement('span');
    ch.className = 'ch';
    ch.style.setProperty('--i', i);

    const inner = document.createElement('i');
    inner.textContent = c;

    ch.append(inner);
    holder.append(ch);
  });
}

/* ---------------------------------------------------------------- i18n */
function renderServices(ul, active) {
  ul.replaceChildren(
    ...SERVICES.map((key) => {
      const li = document.createElement('li');
      li.dataset.s = key;
      li.textContent = t(`svc.${key}`);

      if (active && !active.includes(key)) li.classList.add('off');

      return li;
    })
  );
}

function setServicesActive(active) {
  $$('#rail-services li').forEach((li) => {
    li.classList.toggle('off', !!active && !active.includes(li.dataset.s));
  });
}

function applyLang(next, { persist = true } = {}) {
  lang = LANGS.includes(next) ? next : 'en';
  root.lang = lang;

  if (persist) store.set('jchh-lang', lang);

  $$('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  $$('.langs button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });

  $('meta[name="description"]').setAttribute('content', t('meta.desc'));
  $('#cursor').textContent = t('view');
  $('#project-close').textContent = t('project.close');

  renderServices($('#rail-services'), bySlug[activeSlug].services);
  renderServices($('#inline-services'), null);

  if (openSlug) fillProject(bySlug[openSlug]);

  updateThemeLabel();
  setInfo(bySlug[activeSlug], { animate: false });
  updateTitle();
}

/* ---------------------------------------------------------------- theme */
function updateThemeLabel() {
  const dark = root.dataset.theme === 'dark';

  $('#theme-toggle').textContent = dark ? t('theme.toLight') : t('theme.toDark');

  $('meta[name="theme-color"]').setAttribute(
    'content',
    dark ? '#0F0E0D' : '#FAF6EF'
  );
}

$('#theme-toggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

  root.dataset.theme = next;
  store.set('jchh-theme', next);
  updateThemeLabel();
});

/* ---------------------------------------------------------------- rail info (title / year) */
const idxEl = $('#info-index');
const titleEl = $('#info-title');
const pad = (n) => String(n).padStart(2, '0');
let infoTimer;

function setInfo(p, { animate = true } = {}) {
  const i = projects.indexOf(p);

  // Keep the project number separate; show the year only beside the project name.
  const idx = pad(i + 1);
  const title = `${p.name} / ${p.year}`;

  const apply = () => {
    idxEl.textContent = idx;
    titleEl.textContent = title;
  };

  if (!animate || reduce) {
    apply();
    return;
  }

  const masks = [idxEl.parentElement, titleEl.parentElement];

  clearTimeout(infoTimer);
  masks.forEach((m) => m.classList.add('out'));

  infoTimer = setTimeout(() => {
    apply();
    masks.forEach((m) => m.classList.remove('out'));
  }, 330);
}

function setActiveProject(slug) {
  if (!slug || !bySlug[slug]) return;

  const changed = slug !== activeSlug;
  activeSlug = slug;

  $$('.card').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.slug === slug);
  });

  if (!changed) return;

  setInfo(bySlug[slug]);
  setServicesActive(bySlug[slug].services);
}

/* ---------------------------------------------------------------- scroll: sections, logo size, active card */
function sectionInView() {
  const mid = innerHeight * 0.5;
  let cur = 'work';

  for (const id of Object.keys(sections)) {
    if (sections[id].getBoundingClientRect().top <= mid) {
      cur = id;
    }
  }

  return cur;
}

function cardInView() {
  const cards = $$('.card');

  if (!cards.length) return null;

  const line = window.innerHeight * 0.5;
  let activeCard = null;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();

    if (rect.top <= line && rect.bottom >= line) {
      activeCard = card;
    }
  }

  if (activeCard) {
    return activeCard.dataset.slug;
  }

  let closestCard = null;
  let closestDistance = Infinity;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(
      (rect.top + rect.bottom) / 2 - line
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  }

  return closestCard ? closestCard.dataset.slug : null;
}

  return best.dataset.slug;
}

function updateTitle() {
  const p = openSlug ? bySlug[openSlug] : null;

  document.title = p
    ? `${p.name}: J/CHH`
    : 'J/CHH: Jasmin, UI/UX Designer, Web Developer & AI Builder';
}

function setSection(id) {
  currentSection = id;
  root.dataset.section = id;

  $$('[data-section-link]').forEach((a) => {
    if (a.classList.contains('logo')) return;

    a.setAttribute(
      'aria-current',
      String(a.dataset.sectionLink === id)
    );
  });

  root.classList.toggle('logo-big', id === 'contact');
}

let ticking = false;

function onScroll() {
  if (!ready || openSlug || ticking) return;

  ticking = true;

  requestAnimationFrame(() => {
    ticking = false;

    const id = sectionInView();

    if (id !== currentSection) {
      setSection(id);
      history.replaceState(history.state, '', sectionPath(id));
    }

    if (id === 'work') {
      setActiveProject(cardInView());
    }
  });
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

function scrollToSection(id, behavior = 'smooth') {
  const top = id === 'work' ? 0 : sections[id].offsetTop;

  scrollTo({
    top,
    behavior: reduce ? 'instant' : behavior
  });

  setSection(id);
}

/* ---------------------------------------------------------------- project overlay */
const overlay = $('#project');
const gallery = $('#project-gallery');

function fillProject(p) {
  overlay.style.setProperty('--card-bg', p.bg);

  const title = $('#project-title');
  title.replaceChildren(p.name);

  const yr = document.createElement('span');
  yr.className = 'yr';
  yr.textContent = `/ ${p.year}`;
  title.append(yr);

  $('#project-desc').textContent = p.desc[lang] ?? p.desc.en;

  const visit = $('#project-visit');
  visit.hidden = !p.url;

  if (p.url) {
    visit.href = p.url;
    visit.textContent = t('project.visit');
  }

  renderServices($('#project-services'), p.services);

  gallery.replaceChildren(
    ...p.images.map((im, i) => {
      const fig = document.createElement('figure');
      fig.style.setProperty('--i', i);

      const el = document.createElement('img');

      Object.assign(el, {
        src: im.src,
        alt: im.alt,
        width: im.w,
        height: im.h,
        loading: i < 2 ? 'eager' : 'lazy',
        decoding: 'async'
      });

      fig.append(el);
      return fig;
    })
  );
}

function openProject(slug, { push = true } = {}) {
  const p = bySlug[slug];

  if (!p) {
    navigate('/', { push: false });
    return;
  }

  openSlug = slug;
  fillProject(p);
  gallery.scrollTop = 0;

  if (push) {
    history.pushState(
      { from: 'list', scroll: scrollY },
      '',
      `/project/${slug}`
    );
  }

  root.classList.add('no-scroll');
  overlay.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => overlay.classList.add('open'));

  $('#cursor').classList.remove('on');
  updateTitle();

  gallery.focus({ preventScroll: true });
}

function closeProject({ silent = false } = {}) {
  if (!openSlug) return;

  openSlug = null;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  root.classList.remove('no-scroll');

  updateTitle();

  if (!silent) {
    if (history.state?.from === 'list') {
      history.back();
    } else {
      history.replaceState({}, '', sectionPath(currentSection));
    }
  }
}

$('#project-close').addEventListener('click', () => closeProject());

addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && openSlug) {
    closeProject();
  }
});

/* ---------------------------------------------------------------- navigation */
function navigate(path, { push = true } = {}) {
  const r = parse(path);

  if (r.type === 'project') {
    openProject(r.slug, { push });
    return;
  }

  if (openSlug) {
    closeProject({ silent: true });
  }

  if (push && location.pathname !== sectionPath(r.id)) {
    history.pushState({}, '', sectionPath(r.id));
  }

  scrollToSection(r.id, push ? 'smooth' : 'instant');
  updateTitle();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');

  if (
    !a ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button !== 0
  ) return;

  e.preventDefault();

  if (!ready) return;

  navigate(a.getAttribute('href'));
});

addEventListener('popstate', () => {
  if (!ready) return;

  const r = parse(location.pathname);

  if (r.type === 'project') {
    openProject(r.slug, { push: false });
    return;
  }

  if (openSlug) {
    closeProject({ silent: true });
    return;
  }

  scrollToSection(r.id, 'instant');
});

/* ---------------------------------------------------------------- cursor label */
function initCursor() {
  if (!finePointer) return;

  const cur = $('#cursor');

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let cx = x;
  let cy = y;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
  }, { passive: true });

  (function loop() {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;

    cur.style.transform = `translate3d(${cx + 16}px, ${cy - 4}px, 0)`;

    requestAnimationFrame(loop);
  })();

  for (const card of $$('.card')) {
    card.addEventListener('pointerenter', () => {
      if (openSlug || !ready) return;

      cur.classList.add('on');
      setActiveProject(card.dataset.slug);
    });

    card.addEventListener('pointerleave', () => {
      cur.classList.remove('on');
    });
  }
}

/* ---------------------------------------------------------------- intro */
async function intro(route) {
  const startAtContact = route.type === 'section' && route.id === 'contact';

  if (reduce) {
    root.classList.add('logo-in', 'ui-in');
    root.classList.remove('intro-lock');
    root.classList.toggle('logo-big', startAtContact);
    return;
  }

  await wait(120);

  root.classList.add('logo-in');

  await wait(1900);

  root.classList.add('ui-in');

  if (!startAtContact) {
    root.classList.remove('logo-big');
  }

  root.classList.remove('intro-lock');
}

/* ---------------------------------------------------------------- boot */
async function boot() {
  buildLogo();

  const saved = store.get('jchh-lang');
  const guess = (navigator.language || 'en').slice(0, 2);

  applyLang(
    saved || (LANGS.includes(guess) ? guess : 'en'),
    { persist: false }
  );

  $$('.langs button').forEach((b) => {
    b.addEventListener('click', () => applyLang(b.dataset.lang));
  });

  initCursor();

  const route = parse(location.pathname);

  await intro(route);

  ready = true;

  if (route.type === 'project') {
    setSection('work');
    history.replaceState({ from: null }, '', location.pathname);
    openProject(route.slug, { push: false });
  } else {
    scrollToSection(route.id, 'instant');
    onScroll();
  }

  setActiveProject(cardInView());
}

boot();
