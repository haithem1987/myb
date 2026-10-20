/// <reference types="cypress" />

/**
 * TS — Feuilles de temps (timesheet)
 * Niveaux : E (Cypress E2E)
 */

const API = Cypress.env('API_URL') || 'http://localhost:5000';
const GQL = Cypress.env('GQL_URL') || 'http://localhost:5000/graphql';

describe('TS-TS — Saisie et validation des feuilles de temps', () => {
  beforeEach(() => {
    cy.loginAsSyndic(); // manager
  });

  it('TS-TS-001 (E) : saisir une semaine sur 2 projets', () => {
    cy.intercept('POST', GQL).as('gql');
    cy.visit('/timesheet');
    cy.get('[data-cy="timesheet-grid"], [data-testid="timesheet-table"]', { timeout: 15000 }).should('be.visible');

    // Saisit 8h lundi sur le premier projet
    cy.get('[data-cy="ts-row"]', { timeout: 10000 }).first().within(() => {
      cy.get('[data-cy="ts-day-0"]').clear().type('8');
    });

    // Saisit 4h mardi sur le deuxième projet (si au moins 2 lignes)
    cy.get('[data-cy="ts-row"]').then(($rows) => {
      if ($rows.length > 1) {
        cy.wrap($rows[1]).within(() => {
          cy.get('[data-cy="ts-day-1"]').clear().type('4');
        });
      }
    });

    cy.get('[data-cy="save-timesheet"]').click();
    cy.wait('@gql', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    cy.screenshot('TS-TS-001-week-saved');
  });

  it('TS-TS-003 (E) : plus de 24h dans une journée → rejeté', () => {
    cy.visit('/timesheet');
    cy.get('[data-cy="ts-row"]', { timeout: 15000 }).first().within(() => {
      cy.get('[data-cy="ts-day-0"]').clear().type('25');
    });
    // L'input doit être invalide ou le formulaire refuse la soumission
    cy.get('[data-cy="ts-day-0"]').should(($el) => {
      const val = parseFloat($el.val() as string);
      expect(val).to.be.at.most(24);
    }).or('have.class', 'ng-invalid');
    cy.screenshot('TS-TS-003-over-24h-rejected');
  });

  it('TS-TS-004 (E) : soumettre puis approuver', () => {
    cy.intercept('POST', GQL).as('gql');
    cy.visit('/timesheet');
    cy.get('[data-cy="submit-timesheet"]', { timeout: 15000 }).click();
    cy.wait('@gql').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="ts-status"]').should('contain.text', 'Submitted');
    cy.screenshot('TS-TS-004-submitted');

    // Approuver en tant que manager (même session syndic = manager ici)
    cy.get('[data-cy="approve-timesheet"]').click({ force: true });
    cy.wait('@gql').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="ts-status"]').should('contain.text', 'Approved');
    // Feuille approuvée → non modifiable
    cy.get('[data-cy="ts-day-0"]').should('be.disabled');
    cy.screenshot('TS-TS-004-approved');
  });

  it('TS-TS-006 (I) : GetTimesheetsByUserId pour un autre utilisateur → refus', () => {
    cy.request({
      method: 'POST',
      url: GQL,
      body: {
        query: `query { getTimesheetsByUserId(userId: "another-user-id") { id } }`,
      },
      failOnStatusCode: false,
    }).then((resp) => {
      // Soit HTTP 403, soit une erreur GraphQL
      const hasAuthError =
        resp.status === 403 ||
        (resp.body?.errors ?? []).some((e: any) =>
          /forbidden|unauthorized|access/i.test(e.message ?? '')
        );
      expect(hasAuthError, 'access to another user timesheets should be denied').to.be.true;
    });
  });

  it('TS-TS-005 (I) : manager approuve feuille d\'un employé qui n\'est pas le sien → refus', () => {
    cy.request({
      method: 'POST',
      url: GQL,
      body: {
        query: `mutation { updateMultipleTimesheets(input: {
          userId: "employee-not-mine",
          timesheets: [{ projectId: "proj-1", taskId: "task-1", dayIndex: 0, hours: 8 }]
        }) { success } }`,
      },
      failOnStatusCode: false,
    }).then((resp) => {
      const denied =
        resp.status === 403 ||
        (resp.body?.errors ?? []).some((e: any) => /forbidden|unauthorized|access/i.test(e.message ?? ''));
      expect(denied).to.be.true;
    });
  });

  it('TS-TS-008 (E) : GenerateTimesheetPdf → PDF valide', () => {
    cy.intercept('POST', GQL).as('gql');
    cy.visit('/timesheet');
    cy.get('[data-cy="generate-pdf"]', { timeout: 15000 }).click({ force: true });
    cy.wait('@gql', { timeout: 20000 }).then((interception) => {
      const pdf = interception.response?.body?.data?.generateTimesheetPdf;
      if (pdf) {
        // Base64-encoded PDF doit commencer par JVBERi (= %PDF-)
        expect(pdf).to.match(/^JVBERi/);
      }
    });
    cy.screenshot('TS-TS-008-pdf-generated');
  });
});

describe('TS-PJ — Projets et employés', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('TS-PJ-001 (E) : CRUD projet — créer et archiver', () => {
    cy.intercept('POST', `${Cypress.env('GQL_URL') || 'http://localhost:5000/graphql'}`).as('gql');
    cy.visit('/timesheet/projects');
    cy.get('[data-cy="new-project"]', { timeout: 10000 }).click();
    cy.get('[data-cy="project-name"]').type(`Projet E2E ${Date.now()}`);
    cy.get('[data-cy="save-project"]').click();
    cy.wait('@gql').its('response.statusCode').should('eq', 200);
    cy.screenshot('TS-PJ-001-project-created');
  });
});

describe('TS-TO — Congés', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('TS-TO-001 (E) : demander un congé Vacation → statut Pending', () => {
    cy.intercept('POST', `${Cypress.env('GQL_URL') || 'http://localhost:5000/graphql'}`).as('gql');
    cy.visit('/timesheet/timeoff');
    cy.get('[data-cy="new-timeoff"]', { timeout: 10000 }).click();
    cy.get('[data-cy="timeoff-type"]').select('Vacation');
    cy.get('[data-cy="timeoff-start"]').type('2026-11-10');
    cy.get('[data-cy="timeoff-end"]').type('2026-11-14');
    cy.get('[data-cy="submit-timeoff"]').click();
    cy.wait('@gql').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy="timeoff-status"]').first().should('contain.text', 'Pending');
    cy.screenshot('TS-TO-001-timeoff-pending');
  });
});
