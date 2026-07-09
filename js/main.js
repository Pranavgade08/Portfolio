(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $(".site-header");
  const navToggle = $(".nav-toggle");
  const navMenu = $(".nav-menu");
  const navLinks = $$(".nav-link", navMenu);
  const revealEls = $$('[data-reveal]');

  // Mobile menu
  function setMenuOpen(open) {
    if (!navMenu || !navToggle) return;
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('is-open');
      setMenuOpen(!isOpen);
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!navMenu.contains(t) && !navToggle.contains(t)) setMenuOpen(false);
    });

    navLinks.forEach((a) => {
      a.addEventListener('click', () => setMenuOpen(false));
    });
  }

  // Active link highlighting (scrollspy)
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute('href');
      if (!id || !id.startsWith('#')) return null;
      const el = document.querySelector(id);
      return el ? { id, el, link: a } : null;
    })
    .filter(Boolean);

  function setActiveById(id) {
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
  }

  if (sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (!visible) return;
        const id = `#${visible.target.id}`;
        setActiveById(id);
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5],
        rootMargin: `-${Math.round((header?.offsetHeight || 72) + 10)}px 0px -60% 0px`,
      }
    );

    sections.forEach((s) => obs.observe(s.el));
  }

  // Reveal on scroll
  if (revealEls.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            revealObs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => revealObs.observe(el));
  }

  // Button press feedback
  $$('[data-press]').forEach((el) => {
    el.addEventListener('pointerdown', () => el.classList.add('is-pressed'));
    el.addEventListener('pointerup', () => el.classList.remove('is-pressed'));
    el.addEventListener('pointercancel', () => el.classList.remove('is-pressed'));
    el.addEventListener('mouseleave', () => el.classList.remove('is-pressed'));
  });

  // Footer year
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Scroll progress bar
  const progressEl = $('#scroll-progress');
  if (progressEl) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progressEl.style.width = scrolled + '%';
    });
  }

  // Contact form validation (client-side only)
  const form = $('#contact-form');
  const status = $('#form-status');

  const validators = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    email: (v) => {
      const value = v.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return ok ? '' : 'Please enter a valid email address.';
    },
    subject: (v) => (v.trim().length >= 2 ? '' : 'Please enter a subject.'),
    message: (v) => (v.trim().length >= 10 ? '' : 'Message should be at least 10 characters.'),
  };

  function setFieldError(fieldName, message) {
    const input = $(`#${fieldName}`);
    const errorEl = $(`[data-error-for="${fieldName}"]`);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.textContent = message;
  }

  function validateField(fieldName) {
    const input = $(`#${fieldName}`);
    if (!input) return true;
    const validate = validators[fieldName];
    if (!validate) return true;
    const msg = validate(String(input.value || ''));
    setFieldError(fieldName, msg);
    return !msg;
  }

  function validateAll() {
    return Object.keys(validators).map(validateField).every(Boolean);
  }

  if (form) {
    Object.keys(validators).forEach((name) => {
      const input = $(`#${name}`);
      if (!input) return;
      input.addEventListener('blur', () => validateField(name));
      input.addEventListener('input', () => {
        // Clear error as user edits
        if (input.getAttribute('aria-invalid') === 'true') validateField(name);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (status) status.textContent = '';

      const ok = validateAll();
      if (!ok) {
        if (status) status.textContent = 'Please fix the highlighted fields and try again.';
        return;
      }

      // No backend configured. Keep it simple & lightweight.
      if (status) status.textContent = 'Thanks! Your message is ready to send — connect this form to a backend later.';
      form.reset();
      Object.keys(validators).forEach((name) => setFieldError(name, ''));
    });
  }
})();
