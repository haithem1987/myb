(function () {
  function addHomeLink() {
    var header = document.getElementById('kc-header');
    if (!header || header.querySelector('.myb-home-link')) {
      return;
    }

    var language = (document.documentElement.lang || 'fr').toLowerCase();
    var isFrench = language.indexOf('fr') === 0;
    var homeLink = document.createElement('a');

    homeLink.className = 'myb-home-link';
    homeLink.href = window.location.origin + '/';
    homeLink.textContent = isFrench ? 'Retour à l’accueil' : 'Back to home';
    homeLink.setAttribute(
      'aria-label',
      isFrench ? 'Retourner à l’accueil MYB' : 'Return to the MYB home page'
    );

    header.appendChild(homeLink);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addHomeLink, { once: true });
  } else {
    addHomeLink();
  }
})();
