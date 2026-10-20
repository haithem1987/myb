/// <reference types="cypress" />

// Admin E2E — Finance, Factures & Trésorerie
// Scénarios E (E2E) et V (Visual) uniquement — U (Unit) traités dans Jest

const ADMIN_EMAIL = 'syndic@example.com';
const ADMIN_PASSWORD = 'Admin1234!';

describe('COP-IN — Factures et paiements (admin)', () => {
  beforeEach(() => {
    cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  it('COP-IN-012 — Écran factures du propriétaire + dialogue de paiement', () => {
    cy.goToSyndicSection('fund-calls');
    cy.screenshot('COP-IN-012-invoices-list');

    // Vérification des colonnes montant, devise et statut
    cy.get('[data-cy=invoice-row]').first().within(() => {
      cy.get('[data-cy=invoice-amount]').should('exist');
      cy.get('[data-cy=invoice-currency]').should('contain.text', 'TND');
      cy.get('[data-cy=invoice-status]').should('exist');
    });

    // Ouvrir le dialogue de paiement
    cy.get('[data-cy=invoice-row]').first().find('[data-cy=record-payment-btn]').click();
    cy.get('[data-cy=payment-dialog]').should('be.visible');
    cy.screenshot('COP-IN-012-payment-dialog');
    cy.get('[data-cy=payment-dialog]').find('[data-cy=payment-amount-input]').should('exist');
    cy.get('[data-cy=payment-dialog]').find('[data-cy=cancel-btn]').click();
    cy.get('[data-cy=payment-dialog]').should('not.exist');
  });
});

describe('COP-TR — Trésorerie, impayés et rapports (admin)', () => {
  beforeEach(() => {
    cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  it('COP-TR-008 V — Devise COPRO-A en TND (3 décimales)', () => {
    cy.goToSyndicSection('treasury');
    cy.screenshot('COP-TR-008-tnd-currency');
    cy.get('[data-cy=currency-display]').should('contain.text', 'TND');
    cy.get('[data-cy=amount-display]').first().invoke('text').then((text) => {
      // TND = 3 décimales
      expect(text).to.match(/\d+\.\d{3}/);
    });
  });

  it('COP-TR-008 V — Devise COPRO-B en EUR', () => {
    cy.goToSyndicSection('treasury', Cypress.env('COPRO_B_ID'));
    cy.screenshot('COP-TR-008-eur-currency');
    cy.get('[data-cy=currency-display]').should('contain.text', 'EUR');
  });

  it('COP-TR-009 V — Écran trésorerie : capture de référence', () => {
    cy.goToSyndicSection('treasury');
    cy.get('[data-cy=treasury-dashboard]').should('be.visible');
    cy.screenshot('COP-TR-009-treasury-dashboard');
  });

  it('COP-TR-009 V — Écran impayés : capture de référence', () => {
    cy.goToSyndicSection('unpaid-payments');
    cy.get('[data-cy=unpaid-payments-list]').should('be.visible');
    cy.screenshot('COP-TR-009-unpaid-payments');
  });

  it('COP-TR-009 V — Écran rapports financiers : capture de référence', () => {
    cy.goToSyndicSection('reports');
    cy.get('[data-cy=financial-report]').should('be.visible');
    cy.screenshot('COP-TR-009-financial-report');
  });

  it("COP-TR-010 E — Export d'un rapport financier", () => {
    cy.goToSyndicSection('reports');
    cy.get('[data-cy=export-report-btn]').then(($btn) => {
      if ($btn.length === 0) {
        cy.log('Export non disponible — scénario ignoré (P3)');
        return;
      }
      cy.wrap($btn).click();
      // Vérifier qu'un téléchargement a été déclenché
      cy.readFile('cypress/downloads/report.pdf', { timeout: 10000 }).should('exist');
      cy.screenshot('COP-TR-010-export-done');
    });
  });
});

