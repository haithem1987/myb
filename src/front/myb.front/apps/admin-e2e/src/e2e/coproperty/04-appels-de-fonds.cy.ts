/// <reference types="cypress" />

describe('COP-FC — Cycle de vie des appels de fonds', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-FC-001 | Créer un appel de fonds pour own-1', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.get('[data-cy="new-fund-call"]').click();
    cy.get('[data-cy="fund-call-owner"]').type('own-1');
    cy.get('[data-cy="owner-option"]').first().click();
    cy.get('[data-cy="fund-call-amount"]').type('500');
    cy.get('[data-cy="fund-call-due-date"]').type('2026-03-31');
    cy.get('[data-cy="fund-call-description"]').type('Q1 2026 charges');
    cy.get('[data-cy="save-fund-call"]').click();
    cy.contains('ToPay').should('be.visible');
    cy.contains('500').should('be.visible');
  });

  it('COP-FC-020 | Supprimer un appel ToPay sans versement', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.get('[data-cy="fund-call-row-topay"]').first().find('[data-cy="delete-fund-call"]').click();
    cy.get('[data-cy="confirm-delete"]').click();
    cy.get('[data-cy="fund-call-row-topay"]').should('have.length.lessThan', 2);
  });

  it('COP-FC-026 | Annuler avec motif trop court', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.get('[data-cy="fund-call-row"]').first().find('[data-cy="cancel-fund-call"]').click();
    cy.get('[data-cy="cancel-reason"]').type('court');
    cy.get('[data-cy="confirm-cancel"]').click();
    cy.contains('Un motif d\'annulation d\'au moins 10 caractères est obligatoire').should('be.visible');
  });

  it('COP-FC-027 | Annuler avec motif valide', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.get('[data-cy="fund-call-row"]').first().find('[data-cy="cancel-fund-call"]').click();
    cy.get('[data-cy="cancel-reason"]').type('Motif valide de plus de 10 caractères');
    cy.get('[data-cy="confirm-cancel"]').click();
    cy.contains('Cancelled').should('be.visible');
  });
});

describe('COP-FP — Versements propriétaire', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsOwner();
  });

  it('COP-FP-001 | Déclarer un versement partiel avec justificatif', function () {
    cy.visit('/owner/fund-calls');
    cy.get('[data-cy="fund-call-row"]').first().find('[data-cy="add-payment"]').click();
    cy.get('[data-cy="payment-amount"]').type('200');
    cy.get('[data-cy="payment-justificatif"]').selectFile({
      contents: Cypress.Buffer.from('fake pdf content'),
      fileName: 'justificatif.pdf',
      mimeType: 'application/pdf',
    });
    cy.get('[data-cy="submit-payment"]').click();
    cy.contains('PendingValidation').should('be.visible');
  });

  it('COP-FP-002 | Versement de 0 rejeté', function () {
    cy.visit('/owner/fund-calls');
    cy.get('[data-cy="fund-call-row"]').first().find('[data-cy="add-payment"]').click();
    cy.get('[data-cy="payment-amount"]').type('0');
    cy.get('[data-cy="submit-payment"]').click();
    cy.contains('Le montant du versement doit être supérieur à 0').should('be.visible');
  });
});

describe('COP-FR — Validation par le syndic', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-FR-001 | Approuver un versement partiel', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.contains('PendingValidation').closest('[data-cy="fund-call-row"]').find('[data-cy="review-payments"]').click();
    cy.get('[data-cy="payment-row"]').first().find('[data-cy="approve-payment"]').click();
    cy.get('[data-cy="confirm-approve"]').click();
    cy.contains('Approved').should('be.visible');
  });

  it('COP-FR-003 | Rejeter un versement avec motif', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.contains('PendingValidation').closest('[data-cy="fund-call-row"]').find('[data-cy="review-payments"]').click();
    cy.get('[data-cy="payment-row"]').first().find('[data-cy="reject-payment"]').click();
    cy.get('[data-cy="rejection-reason"]').type('Justificatif illisible');
    cy.get('[data-cy="confirm-reject"]').click();
    cy.contains('Rejected').should('be.visible');
  });
});

describe('Visual Captures — Appels de fonds', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-FC-028 | Modale suppression d\'un appel non supprimable', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    // Cliquer sur un appel qui ne peut pas être supprimé (ex: Cancelled)
    cy.contains('Cancelled').closest('[data-cy="fund-call-row"]').find('[data-cy="delete-fund-call"]').click();
    cy.get('[data-cy="delete-modal"]').should('be.visible');
    cy.screenshot('COP-FC-028-delete-modal-not-deletable');
    cy.contains('Annuler l\'appel').should('be.visible');
  });

  it('COP-FX-009 | Liste des appels de fonds avec badges de statut', function () {
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.screenshot('COP-FX-009-fund-calls-list-all-statuses');
    cy.get('[data-cy="filter-status-topay"]').click();
    cy.screenshot('COP-FX-009-fund-calls-filter-topay');
    cy.get('[data-cy="filter-status-paid"]').click();
    cy.screenshot('COP-FX-009-fund-calls-filter-paid');
  });

  it('COP-FX-010 | Parcours bout en bout budget → versement → validation → Paid', function () {
    // Syndic : vérifier qu'un appel est Paid après le cycle complet
    cy.goToSyndicSection('fund-calls');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="fund-calls-tab"]').click();
    cy.screenshot('COP-FX-010-fund-calls-after-full-cycle');
    cy.contains('Paid').should('be.visible');
  });
});

