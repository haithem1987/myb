/// <reference types="cypress" />

describe('COP-CH — Charges', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-CH-001 | Créer une charge valide', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="charges-tab"]').click();
    cy.get('[data-cy="add-charge"]').click();
    cy.get('[data-cy="charge-type"]').select('Cleaning');
    cy.get('[data-cy="charge-frequency"]').select('Monthly');
    cy.get('[data-cy="charge-amount"]').type('1000');
    cy.get('[data-cy="charge-distribution"]').select('ByShares');
    cy.get('[data-cy="charge-start-date"]').type('2026-01-01');
    cy.get('[data-cy="charge-end-date"]').type('2026-12-31');
    cy.get('[data-cy="save-charge"]').click();
    cy.contains('1 000').should('be.visible');
  });

  it('COP-CH-002 | Date de fin antérieure à la date de début', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="charges-tab"]').click();
    cy.get('[data-cy="add-charge"]').click();
    cy.get('[data-cy="charge-start-date"]').type('2026-06-01');
    cy.get('[data-cy="charge-end-date"]').type('2026-01-01');
    cy.get('[data-cy="save-charge"]').click();
    cy.contains('La date de fin doit être postérieure à la date de début').should('be.visible');
  });

  it('COP-CH-004 | Montant négatif rejeté', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="charges-tab"]').click();
    cy.get('[data-cy="add-charge"]').click();
    cy.get('[data-cy="charge-amount"]').type('-100');
    cy.get('[data-cy="save-charge"]').click();
    cy.get('[data-cy="charge-amount"]').should('have.class', 'ng-invalid');
  });
});

describe('COP-BG — Budget avec appels de fonds', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-BG-001 | Créer un budget valide avec 2 charges et 4 échéances', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="budgets-tab"]').click();
    cy.get('[data-cy="new-budget"]').click();

    // Étape 1 : sélection des charges
    cy.get('[data-cy="charge-checkbox"]').first().check();
    cy.get('[data-cy="charge-checkbox"]').eq(1).check();
    cy.get('[data-cy="next-step"]').click();

    // Étape 2 : échéances trimestrielles
    cy.get('[data-cy="add-due-date"]').click();
    cy.get('[data-cy="due-date-0"]').type('2026-03-31');
    cy.get('[data-cy="due-amount-0"]').type('250');
    cy.get('[data-cy="add-due-date"]').click();
    cy.get('[data-cy="due-date-1"]').type('2026-06-30');
    cy.get('[data-cy="due-amount-1"]').type('250');
    cy.get('[data-cy="add-due-date"]').click();
    cy.get('[data-cy="due-date-2"]').type('2026-09-30');
    cy.get('[data-cy="due-amount-2"]').type('250');
    cy.get('[data-cy="add-due-date"]').click();
    cy.get('[data-cy="due-date-3"]').type('2026-12-31');
    cy.get('[data-cy="due-amount-3"]').type('250');
    cy.get('[data-cy="next-step"]').click();

    // Étape 3 : aperçu et validation
    cy.get('[data-cy="budget-preview"]').should('be.visible');
    cy.get('[data-cy="submit-budget"]').click();
    cy.url().should('include', '/budgets/');
  });

  it('COP-BG-011 | Rouvrir un budget existant', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="budgets-tab"]').click();
    cy.get('[data-cy="budget-row"]').first().click();
    cy.url().should('match', /\/budgets\/[^/]+/);
    cy.get('[data-cy="edit-budget"]').click();
    cy.url().should('match', /\/budgets\/[^/]+\/edit/);
    cy.get('[data-cy="save-budget"]').click();
    cy.url().should('match', /\/budgets\/[^/]+/);
  });
});

describe('Visual Captures — Budgets', () => {
  beforeEach(() => {
    cy.fixture('coproperty').as('data');
    cy.loginAsSyndic();
  });

  it('COP-BG-010 | Écran Nouveau budget — aperçu de la répartition', function () {
    cy.goToSyndicSection('budgets');
    cy.contains(this.data.copro_a.name).click();
    cy.get('[data-cy="budgets-tab"]').click();
    cy.get('[data-cy="new-budget"]').click();
    cy.screenshot('COP-BG-010-budget-wizard-step1');
    cy.get('[data-cy="charge-checkbox"]').first().check();
    cy.get('[data-cy="next-step"]').click();
    cy.screenshot('COP-BG-010-budget-wizard-step2');
    cy.get('[data-cy="add-due-date"]').click();
    cy.get('[data-cy="due-date-0"]').type('2026-03-31');
    cy.get('[data-cy="due-amount-0"]').type('500');
    cy.get('[data-cy="next-step"]').click();
    cy.get('[data-cy="budget-preview"]').should('be.visible');
    cy.screenshot('COP-BG-010-budget-preview');
  });
});

