/// <reference types="cypress" />

describe('COP-UN — Lots', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-UN-001 | Créer un lot valide', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.get('[data-cy="add-unit"]').click();
    cy.get('[data-cy="unit-number"]').type('D401');
    cy.get('[data-cy="unit-type"]').select('Apartment');
    cy.get('[data-cy="unit-shares"]').type('50');
    cy.get('[data-cy="unit-area"]').type('60');
    cy.get('[data-cy="unit-floor"]').type('4');
    cy.get('[data-cy="save-unit"]').click();
    cy.contains('D401').should('be.visible');
  });

  it('COP-UN-006 | Tantièmes négatifs rejetés', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.get('[data-cy="add-unit"]').click();
    cy.get('[data-cy="unit-number"]').type('X999');
    cy.get('[data-cy="unit-shares"]').type('-10');
    cy.get('[data-cy="save-unit"]').click();
    cy.get('[data-cy="unit-shares"]').should('have.class', 'ng-invalid');
  });
});

describe('COP-OW — Propriétaires', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-OW-001 | Créer un propriétaire avec 2 lots', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="owners-tab"]').click();
    cy.get('[data-cy="add-owner"]').click();
    cy.get('[data-cy="owner-firstname"]').type('Jean');
    cy.get('[data-cy="owner-lastname"]').type('Dupont');
    cy.get('[data-cy="owner-email"]').type('jean.dupont@test.com');
    cy.get('[data-cy="unit-checkbox-A101"]').check();
    cy.get('[data-cy="unit-checkbox-A102"]').check();
    cy.get('[data-cy="save-owner"]').click();
    cy.contains('Jean Dupont').should('be.visible');
  });

  it('COP-OW-011 | Email invalide rejeté', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="owners-tab"]').click();
    cy.get('[data-cy="add-owner"]').click();
    cy.get('[data-cy="owner-email"]').type('invalid-email');
    cy.get('[data-cy="save-owner"]').click();
    cy.get('[data-cy="owner-email"]').should('have.class', 'ng-invalid');
  });

  it('COP-OW-005 | ChangeUnitOwner (vente d\'un lot)', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.contains('A101').closest('[data-cy="unit-row"]').find('[data-cy="change-owner"]').click();
    cy.get('[data-cy="new-owner-select"]').type('own-2');
    cy.get('[data-cy="owner-option"]').first().click();
    cy.get('[data-cy="confirm-change-owner"]').click();
    cy.contains('A101').closest('[data-cy="unit-row"]').should('contain.text', 'own-2');
  });
});

describe('COP-TN — Locataires', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-TN-001 | Créer un locataire sur A101', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.contains('A101').closest('[data-cy="unit-row"]').find('[data-cy="add-tenant"]').click();
    cy.get('[data-cy="tenant-firstname"]').type('Marie');
    cy.get('[data-cy="tenant-lastname"]').type('Martin');
    cy.get('[data-cy="tenant-start-date"]').type('2026-01-01');
    cy.get('[data-cy="tenant-end-date"]').type('2026-12-31');
    cy.get('[data-cy="save-tenant"]').click();
    cy.contains('Marie Martin').should('be.visible');
  });

  it('COP-TN-004 | Date de fin antérieure à la date de début rejetée', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.contains('A101').closest('[data-cy="unit-row"]').find('[data-cy="add-tenant"]').click();
    cy.get('[data-cy="tenant-start-date"]').type('2026-06-01');
    cy.get('[data-cy="tenant-end-date"]').type('2026-01-01');
    cy.get('[data-cy="save-tenant"]').click();
    cy.contains('La date de fin doit être postérieure à la date de début').should('be.visible');
  });
});

describe('Visual Captures — Lots & Propriétaires', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-UN-012 | Liste des lots avec pagination', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="units-tab"]').click();
    cy.screenshot('COP-UN-012-units-list');
  });

  it('COP-OW-013 | Écran de gestion des propriétaires', function () {
    cy.goToSyndicSection('units');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="owners-tab"]').click();
    cy.screenshot('COP-OW-013-owner-management');
    cy.get('[data-cy="add-owner"]').click();
    cy.screenshot('COP-OW-013-owner-creation-modal');
  });
});

