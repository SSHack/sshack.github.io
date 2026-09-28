/* Blog SSHack — mesure d'audience Google Analytics 4 soumise au consentement (CNIL) :
   rien n'est chargé tant que le visiteur n'a pas cliqué sur « Accepter ». */
(function () {
  'use strict';
  var GA_ID = 'G-FMQZ8FFER8';
  var KEY = 'sshack-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180; /* choix redemandé au bout de 6 mois */

  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < MAX_AGE) return c.v;
    } catch (e) {}
    return null;
  }

  function saveChoice(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    /* Mesure d'audience uniquement : pas de signaux publicitaires (Google Signals, audiences Ads) */
    window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^_ga/.test(name)) {
        ['', '; domain=.sshack.me', '; domain=sshack.me'].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  var banner = null;
  function closeBanner() {
    if (banner) { banner.remove(); banner = null; }
  }

  function choose(v) {
    var previous = readChoice();
    saveChoice(v);
    closeBanner();
    if (v === 'granted') loadAnalytics();
    else {
      clearAnalyticsCookies();
      if (previous === 'granted') window.location.reload();
    }
  }

  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Choix concernant les cookies de mesure d\'audience');
    banner.innerHTML =
      '<p>Nous utilisons Google Analytics pour mesurer l\'audience du site, uniquement si vous l\'acceptez. ' +
      'Votre choix est conservé 6 mois. <a href="https://sshack.me/politique-de-confidentialite.html#audience">En savoir plus</a></p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn-outline-secondary" data-consent="denied">Refuser</button>' +
      '<button type="button" class="btn btn-outline-secondary" data-consent="granted">Accepter</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (b) choose(b.getAttribute('data-consent'));
    });
    document.body.appendChild(banner);
  }

  function init() {
    var choice = readChoice();
    if (choice === 'granted') loadAnalytics();
    else if (choice === null) showBanner();
    /* Lien « Cookies » du pied de page */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-consent-open]')) { e.preventDefault(); showBanner(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
