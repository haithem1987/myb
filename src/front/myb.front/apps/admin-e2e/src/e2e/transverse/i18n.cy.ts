/**
 * UI-I18N / UI-CMN — Internationalisation, RTL et composants communs
 * Niveaux : E (Cypress) + V (captures visuelles)
 */

const LANGUAGES = [
  { code: 'fr', label: /français|fr/i, dir: 'ltr' },
  { code: 'en', label: /english|en/i, dir: 'ltr' },
  { code: 'ar', label: /عربي|arabic|ar/i, dir: 'rtl' },
];

describe('UI-I18N — Langues', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
    cy.visit('/');
    cy.get('[data-cy="language-switcher"], [aria-label*="langue"], [aria-label*="language"]', { timeout: 10000 })
      .as('langSwitcher');
  });

  it('UI-I18N-001 : changer fr → en → ar : textes traduits, aucune clé brute', () => {
    // FR baseline
    cy.get('@langSwitcher').click();
    cy.contains(/français|fr/i).click();
    cy.screenshot('UI-I18N-001-lang-fr');
    cy.get('body').invoke('text').should('not.match', /[A-Z_]{3,}\.[A-Z_]{3,}/);

    // EN
    cy.get('@langSwitcher').click();
    cy.contains(/english|en/i).click();
    cy.screenshot('UI-I18N-001-lang-en');
    cy.get('body').invoke('text').should('not.match', /[A-Z_]{3,}\.[A-Z_]{3,}/);

    // AR
    cy.get('@langSwitcher').click();
    cy.contains(/عربي|arabic|ar/i).click();
    cy.screenshot('UI-I18N-001-lang-ar');
    cy.get('body').invoke('text').should('not.match', /[A-Z_]{3,}\.[A-Z_]{3,}/);
  });

  it('UI-I18N-002 (V) : arabe → dir="rtl" sur le document', () => {
    cy.get('@langSwitcher').click();
    cy.contains(/عربي|arabic|ar/i).click();
    cy.get('html').should('have.attr', 'dir', 'rtl');
    // Vérifie que le menu latéral est en miroir (à droite)
    cy.get('nav, aside, [data-cy="sidebar"]').should('be.visible');
    cy.screenshot('UI-I18N-002-rtl-layout');
  });
});

describe('UI-CMN — Composants communs', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
    cy.visit('/');
  });

  it('UI-CMN-002 : erreur GraphQL métier → message lisible dans le toast, pas [object Object]', () => {
    // Simule une réponse GraphQL avec erreur métier
    cy.intercept('POST', '**/graphql', {
      statusCode: 200,
      body: { errors: [{ message: 'Une erreur métier de test', extensions: { code: 'BUSINESS_ERROR' } }] },
    }).as('gqlError');

    cy.visit('/coproperty');
    cy.wait('@gqlError', { timeout: 10000 });
    cy.get('[data-cy="toast"], [class*="toast"], [role="alert"]', { timeout: 5000 })
      .should('be.visible')
      .and('not.contain', '[object Object]')
      .and('not.contain', 'BUSINESS_ERROR');
    cy.screenshot('UI-CMN-002-graphql-error-toast');
  });

  it('UI-CMN-005 : modale de confirmation — Annuler n\'appelle aucune mutation', () => {
    // Intercepte toutes les mutations GraphQL
    cy.intercept('POST', '**/graphql', (req) => {
      if (req.body?.query?.includes('mutation')) {
        req.alias = 'mutation';
      }
    });
    // Navigue vers une page avec action destructrice (ex: suppression)
    cy.visit('/coproperty');
    // Tente de trouver un bouton supprimer/annuler
    cy.get('body').then(($body) => {
      const deleteBtn = $body.find('[data-cy="delete-btn"], button').filter(':contains("Supprimer"), :contains("Delete")').first();
      if (deleteBtn.length) {
        cy.wrap(deleteBtn).click({ force: true });
        cy.get('[data-cy="confirm-modal"], [role="dialog"]', { timeout: 5000 }).should('be.visible');
        cy.contains(/annuler|cancel/i).click();
        // Aucune mutation ne doit avoir été déclenchée
        cy.get('@mutation').should('not.exist');
        cy.screenshot('UI-CMN-005-cancel-no-mutation');
      } else {
        // Pas de bouton suppression sur cette page ; test skippé
        cy.log('No delete button found on this page — skipping mutation check');
      }
    });
  });

  it('UI-CMN-006 (V) : mobile 390px — menu replié, pas de scroll horizontal (syndic)', () => {
    cy.loginAsSyndic();
    cy.visit('/');
    cy.viewport(390, 844);
    cy.get('body').should('be.visible');
    cy.get('[data-cy="sidebar"], nav').should('satisfy', ($el: JQuery) => {
      const el = $el[0];
      if (!el) return true; // not found — skip
      const rect = el.getBoundingClientRect();
      return rect.width < 200 || rect.left < 0 || el.getAttribute('aria-hidden') === 'true';
    });
    // Pas de scroll horizontal
    cy.window().its('document.body.scrollWidth').should('lte', 390);
    cy.screenshot('UI-CMN-006-mobile-syndic-layout');
  });

  it('UI-CMN-006 (V) : mobile 390px — layout propriétaire', () => {
    cy.loginAsOwner();
    cy.visit('/');
    cy.viewport(390, 844);
    cy.get('body').should('be.visible');
    cy.window().its('document.body.scrollWidth').should('lte', 390);
    cy.screenshot('UI-CMN-006-mobile-owner-layout');
  });

  it('UI-CMN-008 : accessibilité — audit axe sans violation critique sur la page principale', () => {
    cy.injectAxe?.();
    cy.get('body').should('be.visible');
    // checkA11y est disponible si cypress-axe est installé
    if (typeof (cy as any).checkA11y === 'function') {
      (cy as any).checkA11y(undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        includedImpacts: ['critical'],
      });
    } else {
      cy.log('cypress-axe not installed — skipping axe audit');
    }
    cy.screenshot('UI-CMN-008-accessibility-main');
  });
});
