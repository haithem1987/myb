/// <reference types="cypress" />

/**
 * NOT-CM — Campagnes et historique de communication
 * Niveaux : E (Cypress E2E) + I (requêtes directes)
 */

const API = Cypress.env('API_URL') || 'http://localhost:5000';
const COPRO_ID = Cypress.env('TEST_COPRO_ID') || '00000000-0000-0000-0000-000000000001';

describe('NOT-CM — Campagnes (syndic)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('NOT-CM-008 : destinataires d\'une autre copropriété → refus', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/communication/campaigns`,
      body: {
        name: 'Test isolation',
        copropertyId: Cypress.env('FOREIGN_COPRO_ID') || '00000000-0000-0000-0000-000000000099',
        channels: ['InApp'],
        message: 'Test',
        subject: 'Test',
        recipientIds: ['foreign-owner-1'],
      },
      failOnStatusCode: false,
    }).its('status').should('be.oneOf', [400, 403]);
  });

  it('NOT-CM-009 : logs et stats limités au périmètre du syndic', () => {
    cy.request({
      method: 'GET',
      url: `${API}/api/communication/logs`,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      const logs: any[] = resp.body?.data ?? resp.body ?? [];
      // Tous les logs appartiennent à des copropriétés du syndic courant
      const foreignLogs = logs.filter((l: any) =>
        l.copropertyId && l.copropertyId !== COPRO_ID
      );
      expect(foreignLogs).to.have.length(0);
    });
  });

  it('NOT-CM-012 : propriétaire ne peut pas accéder à /api/communication/* → 403', () => {
    cy.loginAsOwner();
    cy.request({
      method: 'GET',
      url: `${API}/api/communication/logs`,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);

    cy.request({
      method: 'GET',
      url: `${API}/api/communication/campaigns`,
      failOnStatusCode: false,
    }).its('status').should('eq', 403);
  });

  it('NOT-CM-001 + NOT-CM-003 (E) : créer et démarrer une campagne', () => {
    cy.intercept('POST', `${API}/api/communication/campaigns`).as('createCampaign');
    cy.intercept('POST', `${API}/api/communication/campaigns/*/start`).as('startCampaign');

    cy.visit('/communication/campaigns/new');
    cy.get('[data-cy="campaign-name"]', { timeout: 10000 }).type('Campagne E2E AG');
    cy.get('[data-cy="campaign-message"]').type('Rappel : assemblée générale le 20 novembre.');
    cy.get('[data-cy="campaign-subject"]').type('AG copropriété');

    // Sélectionner canal InApp
    cy.get('[data-cy="channel-inapp"]').check({ force: true });

    // Ajouter un destinataire
    cy.get('[data-cy="add-recipient"]').first().click({ force: true });

    cy.get('[data-cy="submit-campaign"]').click();
    cy.wait('@createCampaign', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      const campaignId = interception.response?.body?.id;
      if (campaignId) {
        cy.request({
          method: 'POST',
          url: `${API}/api/communication/campaigns/${campaignId}/start`,
          failOnStatusCode: false,
        }).its('status').should('be.oneOf', [200, 204]);
      }
    });
    cy.screenshot('NOT-CM-003-campaign-started');
  });

  it('NOT-CM-005 (E) : annuler une campagne en cours', () => {
    cy.intercept('POST', `${API}/api/communication/campaigns/*/cancel`).as('cancelCampaign');
    cy.visit('/communication/campaigns');
    cy.get('[data-cy="campaign-running"]', { timeout: 10000 }).first().then(($el) => {
      if ($el.length) {
        cy.wrap($el).find('[data-cy="cancel-campaign"]').click();
        cy.get('[data-cy="confirm-cancel"]').click();
        cy.wait('@cancelCampaign').its('response.statusCode').should('be.oneOf', [200, 204]);
        cy.screenshot('NOT-CM-005-campaign-cancelled');
      } else {
        cy.log('No running campaign to cancel — skipping');
      }
    });
  });

  it('NOT-CM-011 (V) : écrans hub, campagnes et historique', () => {
    cy.visit('/communication');
    cy.screenshot('NOT-CM-011-communication-hub');
    cy.visit('/communication/campaigns');
    cy.screenshot('NOT-CM-011-campaigns-list');
    cy.visit('/communication/history');
    cy.screenshot('NOT-CM-011-history');
  });
});
