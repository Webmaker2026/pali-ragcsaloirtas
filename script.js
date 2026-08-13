/* ============================================================
   {{CEGNEV}} — landing oldal viselkedése
   Vanilla JS: mobilmenü, reveal-animáció, GYIK, űrlap validáció.
   ============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

/* --- Mobilmenü --- */
(function mobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* --- Reveal animáció (IntersectionObserver, staggerelt késleltetéssel) --- */
(function revealOnScroll() {
  const items = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = (Array.from(entry.target.parentElement.children).indexOf(entry.target) % 6) * 90;
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
})();

/* --- Minden második szó kiemelése akcentszínnel a fő címsorokban --- */
(function alternateWordColor() {
  const targets = document.querySelectorAll('.hero__title, .section-title, .urgent-cta__title, .method__title');

  function processNode(node, state) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (part === '') return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        state.index += 1;
        if (state.index % 2 === 0) {
          const span = document.createElement('span');
          span.className = 'word-accent';
          span.textContent = part;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach((child) => processNode(child, state));
    }
  }

  targets.forEach((el) => {
    const state = { index: 0 };
    Array.from(el.childNodes).forEach((child) => processNode(child, state));
  });
})();

/* --- Sima görgetés horgonyokra (fejléc-magasság figyelembevételével) --- */
(function anchorScroll() {
  const header = document.querySelector('.site-header');
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = (header ? header.offsetHeight : 0) + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* --- Ajánlatkérő űrlap validáció --- */
(function quoteFormValidation() {
  const form = document.querySelector('.quote-form');
  if (!form) return;
  const status = document.getElementById('formStatus');

  const messages = {
    valueMissing: 'Ez a mező kötelező.',
    typeMismatch: 'Kérjük, ellenőrizze a formátumot.',
    patternMismatch: 'Érvénytelen formátum.',
  };

  function fieldError(field) {
    return document.querySelector(`[data-error-for="${field.id}"]`);
  }

  function validateField(field) {
    const errorEl = fieldError(field);
    if (!errorEl) return true;

    if (field.validity.valid) {
      field.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      return true;
    }

    let message = 'Kérjük, ellenőrizze ezt a mezőt.';
    if (field.validity.valueMissing) message = messages.valueMissing;
    else if (field.validity.typeMismatch) message = messages.typeMismatch;
    else if (field.validity.patternMismatch) message = messages.patternMismatch;

    if (field.type === 'tel' && field.validity.valueMissing) {
      message = 'Adja meg telefonszámát, hogy visszahívhassuk.';
    }
    if (field.type === 'checkbox' && field.validity.valueMissing) {
      message = 'Az adatkezelési tájékoztató elfogadása kötelező.';
    }

    field.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    return false;
  }

  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = '';

    // Honeypot: ha ki van töltve, elnémítjuk a beküldést (bot).
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) return;

    const requiredFields = form.querySelectorAll('[required]');
    let firstInvalid = null;
    let allValid = true;

    requiredFields.forEach((field) => {
      const valid = validateField(field);
      if (!valid) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!allValid) {
      status.textContent = 'Kérjük, javítsa a pirossal jelölt mezőket.';
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    status.textContent = 'Köszönjük! Hamarosan felvesszük Önnel a kapcsolatot.';
    form.reset();
  });
})();
