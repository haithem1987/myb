/// <reference types="cypress" />

const API = 'http://localhost:8082/api';

const STATEMENT_ID = 'stmt-copro-a-001';

const mockStatement = {
  id: STATEMENT_ID,
  copropertyId: 'copro-a',
  uploadedAt: '2026-10-01T00:00:00Z',
  totalTransactions: 3,
  matched: 1,
  unmatched: 1,
  manualSuggestion: 1,
};

const mockReconciliation = {
  statementId: STATEMENT_ID,
  results: [
    {
      id: 'res-001',
      transactionLabel: 'VIR PROPRIETAIRE DUPONT',
      amount: 500,
      date: '2026-10-01T00:00:00Z',
      status: 'AutoMatched',
      matchedPaymentId: 'pay-001',
    },
    {
      id: 'res-002',
      transactionLabel: 'VIR PROPRIETAIRE MARTIN',
      amount: 300,
      date: '2026-10-05T00:00:00Z',
      status: 'ManualSuggestion',
      matchedPaymentId: 'pay-002',
    },
    {
      id: 'res-003',
      transactionLabel: 'PRELEVEMENT INCONNU',
      amount: 150,
      date: '2026-10-08T00:00:00Z',
      status: 'Unmatched',
      matchedPaymentId: null,
    },
  ],
};

describe('PAY-RV-008 — Rapprochement bancaire (E2E + Visual)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();

    cy.intercept('GET', `${API}/bank-statements?copropertyId=copro-a`, {
      statusCode: 200,
      body: [mockStatement],
    }).as('getStatements');

    cy.intercept(
      'GET',
      `${API}/bank-statements/${STATEMENT_ID}/reconciliation`,
      { statusCode: 200, body: mockReconciliation }
    ).as('getReconciliation');

    cy.intercept('POST', `${API}/bank-statements`, {
      statusCode: 200,
      body: { id: STATEMENT_ID },
    }).as('importStatement');

    cy.intercept(
      'POST',
      `${API}/bank-statements/${STATEMENT_ID}/reconciliation/res-002/validate`,
      { statusCode: 200, body: { validated: true } }
    ).as('validateResult');
  });

  // V — Visual captures

  it('PAY-RV-008-V1 captures the import screen', () => {
    cy.visit('/bank-reconciliation');
    cy.screenshot('PAY-RV-008-import-screen');
  });

  it('PAY-RV-008-V2 captures the reconciliation table with 3 statuses', () => {
    cy.visit(`/bank-reconciliation/${STATEMENT_ID}`);
    cy.wait('@getReconciliation');
    cy.screenshot('PAY-RV-008-reconciliation-table');
  });

  // E — Cypress E2E

  it('PAY-RV-008-E1 imports a CSV file and shows the statement in the list', () => {
    cy.visit('/bank-reconciliation');

    // Simulate file upload via hidden input
    cy.get('[data-cy="import-btn"]').click();
    cy.get('[data-cy="file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from(
          'Date;Libellé;Montant\n01/10/2026;VIR DUPONT;500.00\n'
        ),
        fileName: 'releve-octobre.csv',
        mimeType: 'text/csv',
      },
      { force: true }
    );
    cy.wait('@importStatement');
    cy.wait('@getStatements');

    cy.get('[data-cy="statement-list"]').should('contain', STATEMENT_ID);
    cy.screenshot('PAY-RV-008-after-import');
  });

  it('PAY-RV-008-E2 shows AutoMatched, ManualSuggestion and Unmatched rows', () => {
    cy.visit(`/bank-reconciliation/${STATEMENT_ID}`);
    cy.wait('@getReconciliation');

    cy.get('[data-cy="status-AutoMatched"]').should('exist');
    cy.get('[data-cy="status-ManualSuggestion"]').should('exist');
    cy.get('[data-cy="status-Unmatched"]').should('exist');
    cy.screenshot('PAY-RV-008-three-statuses');
  });

  it('PAY-RV-008-E3 validates a ManualSuggestion and shows confirmed state', () => {
    cy.visit(`/bank-reconciliation/${STATEMENT_ID}`);
    cy.wait('@getReconciliation');

    cy.get('[data-cy="validate-res-002"]').click();
    cy.wait('@validateResult');

    cy.get('[data-cy="status-res-002"]').should('contain', 'Validated');
    cy.screenshot('PAY-RV-008-after-validation');
  });
});

// PAY-PR-001 — OFX parsing (visual stub; unit logic tested in .NET)
describe('PAY-PR — Import OFX (smoke)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();

    cy.intercept('POST', `${API}/bank-statements`, {
      statusCode: 200,
      body: { id: STATEMENT_ID },
    }).as('importOfx');
  });

  it('PAY-PR-001-E accepts an OFX file and returns a statement id', () => {
    cy.visit('/bank-reconciliation');

    cy.get('[data-cy="import-btn"]').click();
    cy.get('[data-cy="file-input"]').selectFile(
      {
        contents: Cypress.Buffer.from(`OFXHEADER:100\nDATA:OFXSGML\n`),
        fileName: 'releve.ofx',
        mimeType: 'application/ofx',
      },
      { force: true }
    );
    cy.wait('@importOfx');
    cy.screenshot('PAY-PR-001-ofx-import');
  });
});
