/// <reference types="cypress" />

// Admin E2E — Maintenance et interventions
// Scénarios E (E2E) et V (Visual) — U (Unit) traités dans Jest

describe('COP-MT — Demandes de maintenance', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-MT-003 E — Le syndic assigne un prestataire (statut Assigned)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'AssignMaintenance') {
        req.alias = 'assignMaintenance';
      }
    });

    cy.goToSyndicSection('maintenance');
    cy.screenshot('COP-MT-003-maintenance-list');

    cy.get('[data-cy=maintenance-row]').first().find('[data-cy=assign-btn]').click();
    cy.get('[data-cy=assign-provider-dialog]').should('be.visible');
    cy.get('[data-cy=provider-select]').first().click();
    cy.get('[data-cy=confirm-assign-btn]').click();

    cy.wait('@assignMaintenance').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=maintenance-row]').first().find('[data-cy=status-badge]')
      .should('contain.text', 'Assigned');
    cy.screenshot('COP-MT-003-assigned');
  });

  it('COP-MT-004 E — InProgress → CompleteMaintenance (dates renseignées)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'UpdateMaintenanceStatus') {
        req.alias = 'updateStatus';
      }
      if (req.body?.operationName === 'CompleteMaintenance') {
        req.alias = 'complete';
      }
    });

    cy.goToSyndicSection('maintenance');

    cy.get('[data-cy=maintenance-row]').first().find('[data-cy=set-inprogress-btn]').click();
    cy.wait('@updateStatus');
    cy.get('[data-cy=maintenance-row]').first().find('[data-cy=complete-btn]').click();
    cy.wait('@complete').its('response.statusCode').should('eq', 200);

    cy.get('[data-cy=maintenance-row]').first().within(() => {
      cy.get('[data-cy=status-badge]').should('contain.text', 'Completed');
      cy.get('[data-cy=completed-date]').should('exist');
    });
    cy.screenshot('COP-MT-004-completed');
  });

  it('COP-MT-007 V — Priorité Emergency mise en évidence', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetMaintenanceRequests') {
        req.alias = 'getRequests';
      }
    });

    cy.goToSyndicSection('maintenance');
    cy.wait('@getRequests');
    cy.screenshot('COP-MT-007-emergency-highlight');

    cy.get('[data-cy=priority-emergency]').should('exist');
  });

  it('COP-MT-009 V — Liste maintenance syndic (filtres statut/catégorie)', () => {
    cy.goToSyndicSection('maintenance');
    cy.screenshot('COP-MT-009-list-default');

    cy.get('[data-cy=filter-status]').then(($el) => {
      if ($el.length) {
        cy.wrap($el).select('Pending');
        cy.screenshot('COP-MT-009-filter-pending');
      }
    });
  });
});

describe('COP-IV — Interventions', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-IV-001 E — Créer une intervention (statut Draft/Planned)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CreateIntervention') {
        req.alias = 'createIntervention';
      }
    });

    cy.goToSyndicSection('interventions/new');
    cy.screenshot('COP-IV-001-form-empty');

    cy.get('[data-cy=intervention-type-select]').first().click();
    cy.get('[data-cy=provider-input]').type('Prestataire Test');
    cy.get('[data-cy=estimated-cost-input]').type('500');
    cy.get('[data-cy=intervention-date-input]').type('2025-12-01');
    cy.get('[data-cy=submit-btn]').click();

    cy.wait('@createIntervention').its('response.statusCode').should('eq', 200);
    cy.screenshot('COP-IV-001-created');
    cy.get('[data-cy=status-badge]').should('satisfy', ($el: JQuery) =>
      ['Draft', 'Planned'].some((s) => $el.text().includes(s))
    );
  });

  it('COP-IV-005 E — CompleteIntervention (statut Completed + date de fin)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CompleteIntervention') {
        req.alias = 'completeIntervention';
      }
    });

    cy.goToSyndicSection('interventions');
    cy.get('[data-cy=intervention-row]').first().find('[data-cy=complete-btn]').click();
    cy.wait('@completeIntervention').its('response.statusCode').should('eq', 200);

    cy.get('[data-cy=intervention-row]').first().within(() => {
      cy.get('[data-cy=status-badge]').should('contain.text', 'Completed');
      cy.get('[data-cy=end-date]').should('exist');
    });
    cy.screenshot('COP-IV-005-completed');
  });

  it('COP-IV-007 E — Modifier une intervention (formulaire prérempli)', () => {
    cy.goToSyndicSection('interventions');
    cy.get('[data-cy=intervention-row]').first().find('[data-cy=edit-btn]').click();

    cy.url().should('include', '/edit');
    cy.screenshot('COP-IV-007-edit-form');

    cy.get('[data-cy=provider-input]').should('not.have.value', '');
    cy.get('[data-cy=provider-input]').clear().type('Nouveau Prestataire');
    cy.get('[data-cy=submit-btn]').click();

    cy.get('[data-cy=success-toast]').should('exist');
    cy.screenshot('COP-IV-007-saved');
  });

  it('COP-IV-009 V — Propriétaire : interventions en lecture seule', () => {
    cy.loginAsOwner ? cy.loginAsOwner() : cy.log('loginAsOwner non disponible — skipped');
    cy.goToSyndicSection('interventions');
    cy.screenshot('COP-IV-009-owner-readonly');
    cy.get('[data-cy=create-btn]').should('not.exist');
    cy.get('[data-cy=edit-btn]').should('not.exist');
  });
});

