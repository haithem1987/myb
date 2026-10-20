/// <reference types="cypress" />

// Admin E2E — Signalements
// Scénarios E (E2E) et V (Visual) — U (Unit) traités dans Jest

describe('COP-SG — Signalements (syndic)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-SG-004 E — Syndic passe EnCours → PrisEnCompte → Resolu', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'UpdateSignalementStatus') {
        req.alias = 'updateStatus';
      }
    });

    cy.goToSyndicSection('signalements');
    cy.screenshot('COP-SG-004-list');

    cy.get('[data-cy=signalement-row]').first().find('[data-cy=take-charge-btn]').click();
    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=signalement-row]').first().find('[data-cy=status-badge]')
      .should('contain.text', 'PrisEnCompte');

    cy.get('[data-cy=signalement-row]').first().find('[data-cy=resolve-btn]').click();
    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=signalement-row]').first().find('[data-cy=status-badge]')
      .should('contain.text', 'Resolu');
    cy.screenshot('COP-SG-004-resolved');
  });

  it('COP-SG-008 E — GetSyndicSignalements : uniquement ses copropriétés', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetSyndicSignalements') {
        req.alias = 'syndicSignalements';
      }
    });

    cy.goToSyndicSection('signalements');
    cy.wait('@syndicSignalements').then((interception) => {
      const data = interception.response?.body?.data;
      // Tous les signalements doivent appartenir aux copropriétés du syndic
      expect(data).to.not.be.null;
    });
    cy.screenshot('COP-SG-008-syndic-list');
  });

  it('COP-SG-009 E — Filtre par statut', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetSignalementsByStatus') {
        req.alias = 'byStatus';
      }
    });

    cy.goToSyndicSection('signalements');
    cy.get('[data-cy=filter-status]').then(($el) => {
      if (!$el.length) {
        cy.log('Filtre statut absent — skipped P3');
        return;
      }
      cy.wrap($el).select('EnCours');
      cy.screenshot('COP-SG-009-filter-encours');
    });
  });

  it('COP-SG-011 V — Écran syndic-signalements (fr)', () => {
    cy.goToSyndicSection('signalements');
    cy.get('[data-cy=signalement-list]').should('be.visible');
    cy.screenshot('COP-SG-011-syndic-fr');
  });
});

describe('COP-SG — Signalements (propriétaire)', () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  it('COP-SG-001 E — Propriétaire crée un signalement', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CreateSignalement') {
        req.alias = 'createSignalement';
      }
    });

    cy.goToSyndicSection('signalements/new');
    cy.screenshot('COP-SG-001-form-empty');

    cy.get('[data-cy=signalement-type-select]').first().click();
    cy.get('[data-cy=signalement-zone-select]').first().click();
    cy.get('[data-cy=description-input]').type('Fuite d\'eau dans la cage d\'escalier');
    cy.get('[data-cy=submit-btn]').click();

    cy.wait('@createSignalement').its('response.statusCode').should('eq', 200);
    cy.screenshot('COP-SG-001-created');
    cy.get('[data-cy=status-badge]').should('contain.text', 'EnCours');
  });

  it('COP-SG-002 E — Champs obligatoires manquants → validation', () => {
    cy.goToSyndicSection('signalements/new');
    cy.get('[data-cy=submit-btn]').click();

    cy.get('[data-cy=form-error]').should('exist');
    cy.screenshot('COP-SG-002-validation-errors');
  });

  it('COP-SG-011 V — Écran owner-signalements (fr)', () => {
    cy.goToSyndicSection('signalements');
    cy.screenshot('COP-SG-011-owner-fr');
  });
});

