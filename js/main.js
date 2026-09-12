/* ============================================================
   A-Leco Management Kft. — patkanyirtasbudapest.hu
   Vanilla JS: mobilmenü, reveal-animáció, sima görgetés,
   ajánlatkérő űrlap validáció és beküldés.
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
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = (Array.from(entry.target.parentElement.children).indexOf(entry.target) % 6) * 80;
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
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
      history.pushState(null, '', id);
    });
  });
})();

/* --- Ajánlatkérő űrlap: validáció + beküldés --- */
(function quoteForm() {
  const form = document.querySelector('.quote-form');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const loadedAt = document.getElementById('f-loaded-at');
  if (loadedAt) loadedAt.value = String(Date.now());

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
    status.removeAttribute('data-state');
    status.textContent = '';

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
      status.setAttribute('data-state', 'error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const submitBtn = form.querySelector('#form-submit');
    if (submitBtn) submitBtn.disabled = true;
    status.textContent = 'Küldés folyamatban…';

    fetch(form.getAttribute('action'), {
      method: 'POST',
      body: new FormData(form),
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((res) => {
        if (res.redirected) {
          window.location.href = res.url;
          return null;
        }
        return res.json().catch(() => ({ ok: res.ok }));
      })
      .then((data) => {
        if (data === null) return;
        if (data && data.ok) {
          window.location.href = 'koszonjuk.html';
          return;
        }
        status.textContent = (data && data.message) || 'Hiba történt a küldés során. Kérjük, próbálja újra, vagy hívjon minket telefonon.';
        status.setAttribute('data-state', 'error');
        if (submitBtn) submitBtn.disabled = false;
      })
      .catch(() => {
        status.textContent = 'Hiba történt a küldés során. Kérjük, próbálja újra, vagy hívjon minket telefonon.';
        status.setAttribute('data-state', 'error');
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();

/* --- Mobil bizalmi sáv: csak az első elem marad látható --- */
(function mobileTrustStrip() {
  const items = Array.from(document.querySelectorAll('.trust__item'));
  if (!items.length) return;

  const media = window.matchMedia('(max-width: 767px)');
  const apply = () => {
    items.forEach((item, index) => {
      item.style.display = media.matches && index > 0 ? 'none' : '';
    });
  };

  apply();
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', apply);
  } else if (typeof media.addListener === 'function') {
    media.addListener(apply);
  }
})();
