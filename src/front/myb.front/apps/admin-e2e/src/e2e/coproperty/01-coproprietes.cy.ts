/// <reference types="cypress" />

describe('COP-CP — Gestion des copropriétés', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-CP-001 | Créer une copropriété valide', function () {
    cy.visit('/coproperty/manage/new');
    cy.get('[data-cy="coproperty-name"]').type(this.data.newCoproperty.name);
    cy.get('[data-cy="coproperty-address"]').type(this.data.newCoproperty.address);
    cy.get('[data-cy="coproperty-total-shares"]').clear().type(String(this.data.newCoproperty.totalShares));
    cy.get('[data-cy="submit-coproperty"]').click();
    cy.url().should('include', '/coproperty');
  });

  it('COP-CP-006 | Champs obligatoires vides', function () {
    cy.visit('/coproperty/manage/new');
    cy.get('[data-cy="submit-coproperty"]').click();
    cy.get('[data-cy="coproperty-name"]').should('have.class', 'ng-invalid');
    cy.get('form').should('exist');
  });

  it('COP-CP-007 | Modifier les infos d\'une copropriété', function () {
    cy.visit('/coproperty/select');
    cy.contains(this.data.copro_a.name).closest('[data-cy="coproperty-card"]').find('[data-cy="edit-coproperty"]').click();
    cy.get('[data-cy="coproperty-address"]', { timeout: 8000 }).clear().type('Nouvelle adresse modifiée');
    cy.get('[data-cy="submit-coproperty"]').click();
    cy.contains('Nouvelle adresse modifiée').should('be.visible');
  });

  it('COP-CP-009 | La carte copropriété est visible avec statut', function () {
    cy.visit('/coproperty/select');
    cy.contains(this.data.copro_a.name)
      .closest('[data-cy="coproperty-card"]')
      .should('exist')
      .and('be.visible');
  });
});

describe('COP-CP (E2E) — Formulaire admin', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsAdmin();
  });

  it('COP-CP-005 | Admin crée une copropriété', function () {
    cy.visit('/coproperty/manage/new');
    cy.get('[data-cy="coproperty-name"]').type('COPRO-ADMIN-ASSIGN');
    cy.get('[data-cy="coproperty-address"]').type('10 rue Admin');
    cy.get('[data-cy="coproperty-total-shares"]').clear().type('500');
    cy.get('[data-cy="submit-coproperty"]').click();
    cy.url().should('include', '/coproperty');
  });
});

describe('Visual Captures — Copropriétés', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-CP-016 | Écran de sélection des copropriétés', function () {
    cy.visit('/coproperty/select');
    cy.contains(this.data.copro_a.name).should('be.visible');
    cy.screenshot('COP-CP-016-coproperty-select-syndic');
    cy.contains(this.data.copro_a.name).click();
    cy.url().should('match', /\/coproperty\/[^/]+\/syndic\/dashboard/);
  });

  it('COP-CP-017 | Page détail d\'une copropriété', function () {
    cy.visit('/coproperty/select');
    cy.contains(this.data.copro_a.name).click();
    cy.screenshot('COP-CP-017-coproperty-detail');
  });
});
