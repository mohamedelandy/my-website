(function () {
  'use strict';

  const root = document.documentElement;
  const mq = (typeof window.matchMedia === 'function') ? window.matchMedia.bind(window) : null;
  const reduceMotion = mq ? mq('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: function () {} };

  /* ── THEME: system default + persisted manual override ── */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeIcon = themeToggle ? themeToggle.querySelector('.theme-icon') : null;
  const systemDark = mq ? mq('(prefers-color-scheme: dark)') : { matches: false, addEventListener: function () {} };
  let stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }

  function applyTheme(mode) {
    if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
      if (themeIcon) themeIcon.textContent = '☾';
      if (themeToggle) themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      root.removeAttribute('data-theme');
      if (themeIcon) themeIcon.textContent = '☼';
      if (themeToggle) themeToggle.setAttribute('aria-label', 'Switch to light theme');
    }
  }
  applyTheme(stored === 'light' || stored === 'dark' ? stored : (systemDark.matches ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  }
  systemDark.addEventListener('change', (e) => {
    try { if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light'); } catch (err) { /* ignore */ }
  });

  /* ── MOBILE MENU ───────────────────────── */
  const menuBtn = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      mobileMenu.hidden = false;
      const first = mobileMenu.querySelector('a');
      if (first) first.focus();
    } else {
      mobileMenu.hidden = true;
      menuBtn.focus();
    }
  }
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    mobileMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ── TYPING EFFECT (skipped for reduced motion) ── */
  const typedEl = document.getElementById('typed');
  const roles = [
    'Mobile Product Architect',
    'Senior React Native Developer',
    'Open Source Creator — react-native-foldface',
    'Native Modules · Swift · Kotlin'
  ];
  if (typedEl && !reduceMotion.matches) {
    let ri = 0, ci = 0, del = false;
    (function type() {
      const s = roles[ri];
      if (!del) {
        typedEl.textContent = s.slice(0, ci++);
        if (ci > s.length) { del = true; setTimeout(type, 2200); return; }
      } else {
        typedEl.textContent = s.slice(0, ci--);
        if (ci < 0) { del = false; ri = (ri + 1) % roles.length; ci = 0; setTimeout(type, 450); return; }
      }
      setTimeout(type, del ? 38 : 68);
    })();
  } else if (typedEl) {
    typedEl.textContent = roles[0];
  }

  /* ── COUNTER ANIMATION ─────────────────── */
  let counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.textContent.includes('+') ? '+' : '';
      if (reduceMotion.matches) { el.textContent = target + suffix; return; }
      let n = 0;
      const step = Math.max(1, Math.ceil(target / 24));
      const t = setInterval(() => {
        n = Math.min(n + step, target);
        el.textContent = n + suffix;
        if (n >= target) clearInterval(t);
      }, 45);
    });
  }

  /* ── SCROLL REVEAL & STAGGER ANIMATIONS ── */
  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    document.documentElement.classList.add('gsap-loaded');
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Section header scroll reveal
      gsap.utils.toArray('.sec-title, .sec-sub, .eyebrow').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 14,
          duration: 0.4,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      // Stagger lists for project cards, traits, stats, achievements
      gsap.utils.toArray('.stagger').forEach((container) => {
        const items = container.children;
        gsap.from(items, {
          opacity: 0,
          y: 18,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
            onEnter: () => {
              if (container.id === 'stats' || container.closest('#stats') || container.classList.contains('stats-grid')) {
                runCounters();
              }
            }
          }
        });
      });

      // Individual reveal elements (about-text, tl-item, skills-groups, etc.)
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          }
        });
      });
    });

    // Interactive Parallax Hero Mockup
    mm.add("(prefers-reduced-motion: no-preference) and (hover: hover)", () => {
      const hero = document.getElementById('hero');
      const phone = document.querySelector('.phone-wrap');

      if (hero && phone) {
        hero.addEventListener('mousemove', (e) => {
          const rect = hero.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          gsap.to(phone, {
            rotateY: x * 15,
            rotateX: -y * 15,
            duration: 0.5,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        });

        hero.addEventListener('mouseleave', () => {
          gsap.to(phone, {
            rotateY: 0,
            rotateX: 0,
            duration: 1,
            ease: 'elastic.out(1, 0.3)'
          });
        });
      }
    });

    // Ensure stats counter runs if reduced motion is preferred
    mm.add("(prefers-reduced-motion: reduce)", () => {
      runCounters();
    });
  } else {
    /* Fallback IntersectionObserver */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
          if (e.target.id === 'stats' || e.target.closest('#stats')) runCounters();
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el));
    const statsEl = document.getElementById('stats');
    if (statsEl) io.observe(statsEl);
  }

  /* ── NAV SCROLL STATE (class-based so media queries stay intact) ── */
  const nav = document.getElementById('nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── ACTIVE NAV LINK ───────────────────── */
  const links = document.querySelectorAll('.nav-links a');
  const so = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('active-link', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('section[id]').forEach((s) => so.observe(s));

  /* ── PROJECT CATEGORY FILTERING ────────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projCards = document.querySelectorAll('.proj-card');
  const statusEl = document.getElementById('filterStatus');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      const filter = btn.dataset.filter;
      let shown = 0;
      projCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('filtered-out', !show);
        if (show) shown++;
      });
      if (statusEl) {
        const label = filter === 'all' ? 'all projects'
          : filter === 'oss' ? 'open-source projects'
          : filter === 'work' ? 'commercial projects' : 'personal projects';
        statusEl.textContent = 'Showing ' + shown + ' ' + label;
      }
      if (typeof window.ScrollTrigger !== 'undefined') {
        window.ScrollTrigger.refresh();
      }
    });
  });

  /* ── PROJECT OVERVIEW DIALOG ───────────── */
  const dialog = document.getElementById('projectDialog');
  let lastTrigger = null;
  const copyFor = {
    foldface: 'react-native-foldface is an open-source React Native library for 3D fold and flip reveal transitions. It runs on Reanimated 4 worklets, rasterizes automatically for performance, supports nested fold cascades, and ships with zero runtime dependencies.',
    qadaa: 'Qadaa is an offline-first, Arabic-first prayer recovery app built on Expo SDK 57. It pairs a Swift/SwiftUI WidgetKit extension with Skia-powered visuals and a 42-flow Maestro E2E suite that keeps regressions out of releases.',
    shopivia: 'Shopivia is a bilingual (AR/EN) e-commerce ecosystem: an Expo 56 mobile app with offline-first WatermelonDB sync, an Express API on PostgreSQL and Redis, Stripe checkout, Socket.IO support chat, and BullMQ background jobs.',
    tjaara: 'Tjaara is a multi-store commerce platform serving Saudi merchants. I lead the mobile architecture across the Stores, Dashboard, and Partners apps — dynamic theming, RTL-first UX, Firebase integrations, and CI/CD on Azure DevOps.'
  };
  if (dialog) {
    document.querySelectorAll('[data-project-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.proj-card');
        if (!card) return;
        lastTrigger = btn;
        const nameEl = card.querySelector('.proj-name');
        const metaEl = card.querySelector('.proj-meta-tag');
        const name = nameEl ? nameEl.textContent.toLowerCase() : '';
        const key = name.includes('foldface') ? 'foldface'
          : name.includes('qadaa') ? 'qadaa'
          : name.includes('tjaara') ? 'tjaara' : 'shopivia';
        const descEl = card.querySelector('.proj-desc');
        const fallbackCopy = descEl ? descEl.textContent.trim() : 'Production mobile product architecture and delivery.';
        document.getElementById('dialogEyebrow').textContent = metaEl ? metaEl.textContent.trim() : 'Project overview';
        document.getElementById('dialogTitle').textContent = nameEl ? nameEl.textContent.trim() : 'Project overview';
        document.getElementById('dialogCopy').textContent = copyFor[key] || fallbackCopy;
        const tagWrap = document.getElementById('dialogTags');
        tagWrap.innerHTML = '';
        card.querySelectorAll('.proj-tags .tag').forEach((t) => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = t.textContent;
          tagWrap.appendChild(span);
        });
        dialog.showModal();
      });
    });
    dialog.querySelectorAll('[data-dialog-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus(); });
  }

  /* ── 3D TILT — fine pointers only, throttled with rAF, disabled for reduced motion ── */
  const finePointer = mq ? mq('(hover: hover) and (pointer: fine)') : { matches: true };
  if (!reduceMotion.matches && finePointer.matches) {
    projCards.forEach((card) => {
      let rafId = null;
      let cachedRect = null;

      card.addEventListener('mouseenter', () => {
        cachedRect = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!cachedRect) cachedRect = card.getBoundingClientRect();
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rx = ((e.clientY - cachedRect.top - cachedRect.height / 2) / (cachedRect.height / 2)) * -4;
          const ry = ((e.clientX - cachedRect.left - cachedRect.width / 2) / (cachedRect.width / 2)) * 4;
          card.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-6px)';
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        cachedRect = null;
        card.style.transform = '';
      });
    });
  }
})();
