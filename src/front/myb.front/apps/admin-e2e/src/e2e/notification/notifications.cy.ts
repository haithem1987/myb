/// <reference types="cypress" />

/**
 * NOT-IN — Notifications in-app et SignalR
 * Niveaux : E (Cypress E2E)
 */

const API = Cypress.env('API_URL') || 'http://localhost:5000';
const COPRO_ID = Cypress.env('TEST_COPRO_ID') || '00000000-0000-0000-0000-000000000001';

describe('NOT-IN — Notifications in-app', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('NOT-IN-004 : GET /api/notifications/{userId} — les siennes → 200, celles d\'un autre → 403', () => {
    // Intercept avant de déclencher la page qui charge les notifs
    cy.intercept('GET', `${API}/api/notifications/**`).as('getNotifs');
    cy.visit('/');
    cy.wait('@getNotifs', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 304]);
    });

    // Tentative d'accès aux notifs d'un autre utilisateur via requête directe
    cy.request({
      method: 'GET',
      url: `${API}/api/notifications/another-user-id`,
      headers: {
        Authorization: `Bearer ${cy.state('window')?.localStorage?.getItem('kc_token') ?? ''}`,
      },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([401, 403]);
    });
    cy.screenshot('NOT-IN-004-own-notifs');
  });

  it('NOT-IN-005 : Dropdown badge — marquer comme lu et tout marquer comme lu', () => {
    cy.intercept('PUT', `${API}/api/notifications/*/read`).as('markRead');
    cy.intercept('PUT', `${API}/api/notifications/read-all/**`).as('markAllRead');

    cy.visit('/');
    cy.get('[data-cy="notification-dropdown"], [data-testid="notification-bell"]', { timeout: 10000 })
      .first()
      .click();
    cy.screenshot('NOT-IN-005-dropdown-open');

    // Marquer une notification comme lue si présente
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="notification-item"]').length) {
        cy.get('[data-cy="notification-item"]').first().find('[data-cy="mark-read"]').click({ force: true });
        cy.wait('@markRead').its('response.statusCode').should('be.oneOf', [200, 204]);
      }
    });

    // Tout marquer comme lu
    cy.get('[data-cy="mark-all-read"]').click({ force: true });
    cy.wait('@markAllRead').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.get('[data-cy="notification-badge"]').should('not.exist').or('have.text', '0');
    cy.screenshot('NOT-IN-005-all-read');
  });

  it('NOT-IN-006 (V) : Dropdown badge, liste et lien profond', () => {
    cy.visit('/');
    cy.get('[data-cy="notification-dropdown"], [data-testid="notification-bell"]', { timeout: 10000 })
      .first()
      .click();
    cy.screenshot('NOT-IN-006-dropdown-visible');

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="notification-item"]').length) {
        cy.get('[data-cy="notification-item"]').first().click({ force: true });
        cy.screenshot('NOT-IN-006-deep-link-followed');
      }
    });
  });

  it('NOT-IN — SignalR : pas de connexion sans jeton (intercept WebSocket)', () => {
    // cy.intercept ne gère pas WS nativement ; on vérifie via réseau que le hub répond 401/403 sans auth
    cy.request({
      method: 'GET',
      url: `${API}/hubs/notification`,
      headers: { Accept: 'text/event-stream' },
      failOnStatusCode: false,
    }).then((resp) => {
      // SignalR renvoie 401 quand le jeton est absent
      expect(resp.status).to.be.oneOf([401, 403, 307, 302]);
    });
    cy.screenshot('NOT-IN-003-hub-no-token');
  });
});
