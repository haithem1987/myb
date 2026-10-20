/**
 * AUTH — Authentification, rôles et contrôle d'accès
 * Couvre : AUTH-KC (Keycloak/jeton) et AUTH-NAV (routage par rôle)
 * Niveaux : E (Cypress E2E) + V (captures visuelles)
 */

describe('AUTH-KC — Keycloak et jeton', () => {
  it('AUTH-KC-001 : accès route protégée sans session → redirection Keycloak', () => {
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.visit('/coproperty', { failOnStatusCode: false });
    // Angular authGuard redirige vers Keycloak ou la page login interne
    cy.url({ timeout: 10000 }).should('satisfy', (url: string) =>
      url.includes('/auth') || url.includes('keycloak') || url.includes('realms') || url.includes('login')
    );
    cy.screenshot('AUTH-KC-001-redirect-to-login');
  });

  it('AUTH-KC-002 : connexion valide (syndic) → tableau de bord + jeton dans les requêtes', () => {
    cy.loginAsSyndic();
    cy.intercept('POST', '**/graphql').as('gqlRequest');
    cy.visit('/');
    cy.url({ timeout: 15000 }).should('include', '/syndic');
    cy.screenshot('AUTH-KC-002-syndic-dashboard');
    // Vérifie que le jeton Bearer est présent dans les appels GraphQL
    cy.wait('@gqlRequest', { timeout: 15000 }).then((interception) => {
      expect(interception.request.headers).to.have.property('authorization');
      expect(interception.request.headers['authorization']).to.match(/^Bearer\s+\S+/i);
    });
  });

  it('AUTH-KC-005 : déconnexion → session fermée, retour en arrière ne rouvre pas l\'espace', () => {
    cy.loginAsSyndic();
    cy.visit('/');
    cy.url({ timeout: 10000 }).should('include', '/syndic');
    // Déclenche le logout via l'UI (bouton ou nav)
    cy.get('[data-cy="user-dropdown"], [data-testid="logout-btn"], button').contains(/déconnect|logout|sign.out/i).first().click({ force: true });
    cy.screenshot('AUTH-KC-005-after-logout');
    cy.url({ timeout: 10000 }).should('satisfy', (url: string) =>
      url.includes('login') || url.includes('keycloak') || url.includes('realms') || url === Cypress.config('baseUrl') + '/'
    );
    // Le retour en arrière ne doit pas redonner accès
    cy.go('back');
    cy.url({ timeout: 5000 }).should('not.include', '/syndic/dashboard');
  });
});

describe('AUTH-NAV — Routage par rôle (frontend)', () => {
  it('AUTH-NAV-001 : syndic → redirigé vers espace syndic après connexion', () => {
    cy.loginAsSyndic();
    cy.visit('/');
    cy.url({ timeout: 15000 }).should('match', /\/(coproperty|syndic)/);
    cy.screenshot('AUTH-NAV-001-syndic-landing');
  });

  it('AUTH-NAV-002 : conseil (CNS) → redirigé vers /coproperty/council/dashboard', () => {
    cy.loginAsCouncil();
    cy.visit('/');
    cy.url({ timeout: 15000 }).should('include', 'council');
    cy.screenshot('AUTH-NAV-002-council-landing');
  });

  it('AUTH-NAV-003 : comptable (CPT) → redirigé vers /coproperty/accountant/dashboard', () => {
    cy.loginAsAccountant();
    cy.visit('/');
    cy.url({ timeout: 15000 }).should('include', 'accountant');
    cy.screenshot('AUTH-NAV-003-accountant-landing');
  });

  it('AUTH-NAV-004 : propriétaire → redirigé vers espace propriétaire', () => {
    cy.loginAsOwner();
    cy.visit('/');
    cy.url({ timeout: 15000 }).should('match', /\/(coproperty|owner)/);
    cy.screenshot('AUTH-NAV-004-owner-landing');
  });

  it('AUTH-NAV-006 : propriétaire tente /coproperty/:id/syndic → access-denied (P1 — isolation)', () => {
    cy.loginAsOwner();
    const testCoproId = Cypress.env('TEST_COPRO_ID') || '00000000-0000-0000-0000-000000000001';
    cy.visit(`/coproperty/${testCoproId}/syndic/dashboard`, { failOnStatusCode: false });
    cy.url({ timeout: 10000 }).should('satisfy', (url: string) =>
      url.includes('access-denied') || url.includes('403') || !url.includes('/syndic/')
    );
    cy.screenshot('AUTH-NAV-006-owner-denied-syndic-route');
  });

  it('AUTH-NAV-008 : copropertyContextGuard avec copropriété non assignée → refus ou /coproperty/select (P1)', () => {
    cy.loginAsSyndic();
    const foreignId = Cypress.env('FOREIGN_COPRO_ID') || '00000000-0000-0000-0000-000000000099';
    cy.visit(`/coproperty/${foreignId}/syndic/dashboard`, { failOnStatusCode: false });
    cy.url({ timeout: 10000 }).should('satisfy', (url: string) =>
      url.includes('select') || url.includes('access-denied') || url.includes('403') || !url.includes(foreignId)
    );
    cy.screenshot('AUTH-NAV-008-syndic-foreign-copro-denied');
  });

  it('AUTH-NAV-012 : route inconnue → 404 ou redirection prévue', () => {
    cy.loginAsSyndic();
    cy.visit('/this-route-does-not-exist-xyz', { failOnStatusCode: false });
    cy.url({ timeout: 5000 }).should('satisfy', (url: string) =>
      url.includes('404') || url.includes('not-found') || !url.includes('does-not-exist')
    );
    cy.screenshot('AUTH-NAV-012-unknown-route');
  });

  it('AUTH-NAV-013 (V) : menu latéral filtré — captures par rôle', () => {
    const roles: Array<{ name: string; login: () => void }> = [
      { name: 'syndic', login: () => cy.loginAsSyndic() },
      { name: 'owner', login: () => cy.loginAsOwner() },
      { name: 'admin', login: () => cy.loginAsAdmin() },
    ];
    roles.forEach(({ name, login }) => {
      login();
      cy.visit('/');
      cy.get('nav, [data-cy="sidebar"], aside', { timeout: 10000 }).should('be.visible');
      cy.screenshot(`AUTH-NAV-013-sidebar-${name}`);
    });
  });
});
