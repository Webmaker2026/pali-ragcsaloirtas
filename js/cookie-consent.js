/* ============================================================
   A-Leco Management Kft. — patkanyirtasbudapest.hu
   Cookie / süti hozzájárulás-kezelés (GDPR / ePrivacy).

   A látogató döntését a böngésző saját, helyi tárolójában
   (localStorage) őrizzük meg — ez eszközönként/böngészőnként
   külön tárolódik, szervert nem érint, és a "Szükséges" kategóriába
   tartozik (a hozzájárulás megjegyzéséhez elengedhetetlen).

   Kategóriák:
   - necessary  — mindig true, nem kapcsolható ki
   - statistics — alapértelmezetten false, jelenleg nincs mögötte
                  aktív mérőkód (előkészítve pl. GA4-hez)
   - marketing  — alapértelmezetten false, jelenleg nincs mögötte
                  aktív technológia (előkészítve pl. Google Ads
                  konverziómérés / GTM-hez)

   A window.dataLayer / gtag stub és az alapértelmezett (denied)
   Google Consent Mode v2 állapot a <head>-ben, ennél a fájlnál
   korábban töltődik be minden oldalon — így ha a jövőben tényleges
   GA4/GTM/Google Ads címke kerül beillesztésre, az már a helyes
   kiinduló hozzájárulási állapotot találja, és ez a szkript csak
   frissíti azt a látogató tényleges döntése alapján.
   ============================================================ */

(function cookieConsent() {
  var STORAGE_KEY = 'aleco_cookie_consent';
  var CONSENT_VERSION = 1;

  var els = {};
  var lastFocusedEl = null;

  function $(id) { return document.getElementById(id); }

  function readConsent() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null; // localStorage nem elérhető (pl. letiltva) — banner marad látható
    }
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.statistics === 'boolean' && typeof parsed.marketing === 'boolean') {
        return parsed;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function writeConsent(statistics, marketing) {
    var state = {
      necessary: true,
      statistics: !!statistics,
      marketing: !!marketing,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage nem elérhető — a döntést csak a jelenlegi oldalbetöltésre alkalmazzuk
    }
    applyConsent(state);
    return state;
  }

  /* --- Google Consent Mode v2 szinkronizálása -----------------
     A gtag stub a <head>-ben már definiálva van minden oldalon.
     Amíg nincs ténylegesen betöltött GA4/GTM/Google Ads címke,
     ez csak a dataLayer tömbbe ír, kifelé nem küld semmit. */
  function updateGtagConsent(state) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: state.statistics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied',
    });
  }

  var statisticsActivated = false;
  var marketingActivated = false;

  function activateStatistics() {
    if (statisticsActivated) return;
    statisticsActivated = true;
    // Ide kerülhet majd a tényleges statisztikai mérőkód (pl. GA4 / GTM)
    // betöltése, ha a szolgáltatás bevezetésre kerül. Jelenleg a
    // weboldalon nincs ilyen technológia, ezért ez a függvény nem
    // tölt be semmit — csak a bekapcsolt állapotot jelzi előre.
  }

  function activateMarketing() {
    if (marketingActivated) return;
    marketingActivated = true;
    // Ide kerülhet majd pl. a Google Ads konverziókövető címke
    // betöltése, ha a szolgáltatás bevezetésre kerül. Jelenleg a
    // weboldalon nincs ilyen technológia, ezért ez a függvény nem
    // tölt be semmit — csak a bekapcsolt állapotot jelzi előre.
  }

  function applyConsent(state) {
    updateGtagConsent(state);
    if (state.statistics) activateStatistics();
    if (state.marketing) activateMarketing();
    document.dispatchEvent(new CustomEvent('aleco:consent-changed', { detail: state }));
  }

  /* --- Banner --- */
  function showBanner() {
    if (els.banner) els.banner.hidden = false;
  }
  function hideBanner() {
    if (els.banner) els.banner.hidden = true;
  }

  /* --- Beállítások modal --- */
  function setToggles(state) {
    if (els.toggleStatistics) els.toggleStatistics.checked = !!(state && state.statistics);
    if (els.toggleMarketing) els.toggleMarketing.checked = !!(state && state.marketing);
  }

  function openModal() {
    var current = readConsent();
    setToggles(current || { statistics: false, marketing: false });
    lastFocusedEl = document.activeElement;
    if (els.modal) {
      els.modal.hidden = false;
      if (els.modalClose) els.modalClose.focus();
    }
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (els.modal) els.modal.hidden = true;
    document.removeEventListener('keydown', onModalKeydown);
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  function decide(statistics, marketing) {
    writeConsent(statistics, marketing);
    hideBanner();
    closeModal();
  }

  function init() {
    els.banner = $('cookieBanner');
    els.acceptAll = $('cookieAcceptAll');
    els.rejectAll = $('cookieRejectAll');
    els.openSettings = $('cookieOpenSettings');
    els.modal = $('cookieModal');
    els.modalBackdrop = els.modal ? els.modal.querySelector('[data-cookie-close]') : null;
    els.modalClose = $('cookieModalClose');
    els.modalSave = $('cookieModalSave');
    els.modalAcceptAll = $('cookieModalAcceptAll');
    els.modalRejectAll = $('cookieModalRejectAll');
    els.toggleStatistics = $('cookieToggleStatistics');
    els.toggleMarketing = $('cookieToggleMarketing');

    if (!els.banner) return;

    var stored = readConsent();
    if (stored) {
      applyConsent(stored);
      hideBanner();
    } else {
      showBanner();
    }

    if (els.acceptAll) els.acceptAll.addEventListener('click', function () { decide(true, true); });
    if (els.rejectAll) els.rejectAll.addEventListener('click', function () { decide(false, false); });
    if (els.modalAcceptAll) els.modalAcceptAll.addEventListener('click', function () { decide(true, true); });
    if (els.modalRejectAll) els.modalRejectAll.addEventListener('click', function () { decide(false, false); });
    if (els.modalSave) {
      els.modalSave.addEventListener('click', function () {
        var statistics = !!(els.toggleStatistics && els.toggleStatistics.checked);
        var marketing = !!(els.toggleMarketing && els.toggleMarketing.checked);
        decide(statistics, marketing);
      });
    }

    if (els.openSettings) els.openSettings.addEventListener('click', openModal);
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.modalBackdrop) els.modalBackdrop.addEventListener('click', closeModal);

    // Footer / lábléc "Cookie beállítások" linkek — bármelyik oldalon
    // bármikor újranyithatók, a korábbi döntés módosításához/visszavonásához.
    document.querySelectorAll('[data-cookie-open-settings]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AlecoCookieConsent = {
    getConsent: readConsent,
    openSettings: openModal,
  };
})();
