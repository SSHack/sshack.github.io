/* Blog SSHack — Google Analytics 4 chargé sur toutes les pages sans bandeau de consentement :
   tous les signaux Google (mesure, publicité, personnalisation) sont accordés d'office. */
(function () {
  'use strict';
  var GA_ID = 'G-FMQZ8FFER8';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: true, allow_ad_personalization_signals: true });
})();
