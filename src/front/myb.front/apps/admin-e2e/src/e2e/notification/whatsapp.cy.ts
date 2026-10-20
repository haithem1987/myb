/// <reference types="cypress" />

/**
 * NOT-WA — Configuration WhatsApp par copropriété
 * Niveaux : E (Cypress E2E) + I (requêtes directes)
 */

const API = Cypress.env('API_URL') || 'http://localhost:5000';
const COPRO_ID = Cypress.env('TEST_COPRO_ID') || '00000000-0000-0000-0000-000000000001';
const FOREIGN_COPRO_ID = Cypress.env('FOREIGN_COPRO_ID') || '00000000-0000-0000-0000-000000000099';

describe('NOT-WA — WhatsApp config (syndic)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('NOT-WA-002 : GET config — le jeton n\'est pas renvoyé en clair', () => {
    cy.request({
      method: 'GET',
      url: `${API}/api/coproperty/${COPRO_ID}/whatsapp-config`,
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 200) {
        const body = JSON.stringify(resp.body);
        // Le jeton ne doit jamais apparaître en clair : pas de propriété accessToken avec une valeur longue
        expect(body).not.to.match(/"accessToken"\s*:\s*"[^"]{10,}"/);
      } else {
        // 404 = pas de config, acceptable
        expect(resp.status).to.be.oneOf([404, 401, 403]);
      }
    });
  });

  it('NOT-WA-003 : propriétaire ne peut pas lire/modifier la config WhatsApp → 403', () => {
    cy.loginAsOwner();
    cy.request({
      method: 'GET',
      url: `${API}/api/coproperty/${COPRO_ID}/whatsapp-config`,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);

    cy.request({
      method: 'PUT',
      url: `${API}/api/coproperty/${COPRO_ID}/whatsapp-config`,
      body: { phoneNumberId: '123', accessToken: 'tok' },
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('NOT-WA-004 : syndic-A ne peut pas lire la config WhatsApp de COPRO-B → 403', () => {
    cy.request({
      method: 'GET',
      url: `${API}/api/coproperty/${FOREIGN_COPRO_ID}/whatsapp-config`,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('NOT-WA-010 : Webhook GET avec bon token → 200 + challenge', () => {
    const verifyToken = Cypress.env('WA_VERIFY_TOKEN') || 'myb-webhook-verify';
    cy.request({
      method: 'GET',
      url: `${API}/api/whatsapp/webhook`,
      qs: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': 'challenge123',
      },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      expect(resp.body).to.include('challenge123');
    });
  });

  it('NOT-WA-011 : Webhook GET avec mauvais token → 403', () => {
    cy.request({
      method: 'GET',
      url: `${API}/api/whatsapp/webhook`,
      qs: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'challenge123',
      },
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('NOT-WA-013 : Webhook POST sans signature → refusé', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/whatsapp/webhook`,
      body: { object: 'whatsapp_business_account', entry: [] },
      failOnStatusCode: false,
    }).its('status').should('be.oneOf', [400, 401, 403]);
  });

  it('NOT-WA-001 (E) : PUT configuration → écran syndic-settings', () => {
    cy.intercept('PUT', `${API}/api/coproperty/${COPRO_ID}/whatsapp-config`).as('putConfig');
    cy.visit(`/coproperty/${COPRO_ID}/syndic/settings`);
    cy.get('[data-cy="whatsapp-phone-number-id"], [data-testid="wa-phone-id"]', { timeout: 10000 })
      .first()
      .clear()
      .type('12345678901234');
    cy.get('[data-cy="whatsapp-access-token"], [data-testid="wa-access-token"]')
      .first()
      .clear()
      .type('EAAtest-token-value');
    cy.get('[data-cy="save-whatsapp-config"], [data-testid="save-wa"]').first().click();
    cy.wait('@putConfig').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.screenshot('NOT-WA-001-config-saved');
  });
});
