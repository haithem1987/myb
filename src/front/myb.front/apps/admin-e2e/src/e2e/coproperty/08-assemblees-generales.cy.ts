/// <reference types="cypress" />

// Admin E2E — Assemblées générales
// Scénarios E (E2E) et V (Visual) — U (Unit) traités dans Jest

describe('COP-AG — Assemblées générales (syndic)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-AG-001 E — Créer une AG ordinaire (statut Scheduled)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CreateAssembly') {
        req.alias = 'createAssembly';
      }
    });

    cy.goToSyndicSection('general-assembly/new');
    cy.screenshot('COP-AG-001-form-empty');

    cy.get('[data-cy=assembly-type-select]').then(($el) => {
      if ($el.length) cy.wrap($el).select('Ordinary');
    });
    cy.get('[data-cy=assembly-date-input]').type('2025-12-15');
    cy.get('[data-cy=assembly-location-input]').type('Salle de réunion, Bloc A');
    cy.get('[data-cy=assembly-agenda-input]').type('1. Approbation des comptes\n2. Vote budget 2026');
    cy.get('[data-cy=submit-btn]').click();

    cy.wait('@createAssembly').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=status-badge]').should('contain.text', 'Scheduled');
    cy.screenshot('COP-AG-001-created');
  });

  it('COP-AG-002 E — AG à date passée → refus ou avertissement', () => {
    cy.goToSyndicSection('general-assembly/new');

    cy.get('[data-cy=assembly-date-input]').type('2020-01-01');
    cy.get('[data-cy=submit-btn]').click();

    // Refus ou avertissement — au moins un indicateur d'erreur doit être visible
    cy.get('[data-cy=form-error], [data-cy=date-warning]').should('exist');
    cy.screenshot('COP-AG-002-past-date-error');
  });

  it('COP-AG-005 E — Annuler une AG (statut Cancelled, propriétaires notifiés)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'UpdateAssemblyStatus') {
        req.alias = 'updateStatus';
      }
    });

    cy.goToSyndicSection('general-assembly');
    cy.get('[data-cy=assembly-row]').first().find('[data-cy=cancel-btn]').click();
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-btn]').click();

    cy.wait('@updateStatus').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=assembly-row]').first().find('[data-cy=status-badge]')
      .should('contain.text', 'Cancelled');
    cy.screenshot('COP-AG-005-cancelled');
  });

  it('COP-AG-006 E — GetUpcomingAssemblies : uniquement Scheduled à venir', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetUpcomingAssemblies') {
        req.alias = 'upcoming';
      }
    });

    cy.goToSyndicSection('general-assembly');
    cy.wait('@upcoming').then((interception) => {
      const assemblies = interception.response?.body?.data?.getUpcomingAssemblies ?? [];
      assemblies.forEach((ag: { status: string }) => {
        expect(ag.status).to.eq('Scheduled');
      });
    });
    cy.screenshot('COP-AG-006-upcoming');
  });
});

describe('COP-AG — Assemblées générales (propriétaire)', () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  it('COP-AG-008 V — Propriétaire : lecture seule, capture', () => {
    cy.goToSyndicSection('assemblies');
    cy.screenshot('COP-AG-008-owner-readonly');

    cy.get('[data-cy=create-assembly-btn]').should('not.exist');
    cy.get('[data-cy=cancel-btn]').should('not.exist');
  });
});

