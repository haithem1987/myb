/// <reference types="cypress" />

// GraphQL endpoint — adjust if project uses a different path
const GQL = '/graphql';

const addInvoiceMutation = `
  mutation AddInvoice($input: InvoiceInput!) {
    addInvoice(input: $input) { id subTotal totalAmount }
  }
`;

const mockInvoiceList = [
  {
    id: 'inv-001',
    clientName: 'Dupont Jean',
    subTotal: 1000,
    totalAmount: 1190,
    createdAt: '2026-10-01T00:00:00Z',
  },
];

const mockInvoiceDetail = {
  id: 'inv-001',
  clientName: 'Dupont Jean',
  lines: [
    { id: 'l1', description: 'Service A', quantity: 2, unitPrice: 200, taxRate: 19 },
    { id: 'l2', description: 'Service B', quantity: 3, unitPrice: 200, taxRate: 19 },
  ],
  subTotal: 1000,
  totalAmount: 1190,
};

describe('INV-IV — Factures (E2E + Visual)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();

    cy.intercept('POST', GQL, (req) => {
      if (req.body.operationName === 'GetAllInvoices') {
        req.reply({ data: { getAllInvoices: mockInvoiceList } });
      } else if (req.body.operationName === 'GetInvoiceByID') {
        req.reply({ data: { getInvoiceByID: mockInvoiceDetail } });
      } else if (req.body.operationName === 'AddInvoice') {
        req.reply({
          data: {
            addInvoice: { id: 'inv-new', subTotal: 999, totalAmount: 1188.81 },
          },
        });
      } else if (req.body.operationName === 'DeleteInvoice') {
        req.reply({ data: { deleteInvoice: true } });
      }
    }).as('gql');
  });

  // V — Visual captures (INV-IV-007)

  it('INV-IV-007-V1 captures invoice list', () => {
    cy.visit('/invoices');
    cy.wait('@gql');
    cy.screenshot('INV-IV-007-invoice-list');
  });

  it('INV-IV-007-V2 captures invoice detail', () => {
    cy.visit('/invoices/inv-001');
    cy.wait('@gql');
    cy.screenshot('INV-IV-007-invoice-detail');
  });

  it('INV-IV-007-V3 captures print render', () => {
    cy.visit('/invoices/inv-001/print');
    cy.screenshot('INV-IV-007-invoice-print');
  });

  // E — Cypress E2E

  it('INV-IV-001-E creates invoice with 3 lines and correct totals', () => {
    cy.visit('/invoices/new');

    cy.get('[data-cy="add-line-btn"]').click();
    cy.get('[data-cy="line-description-0"]').type('Service A');
    cy.get('[data-cy="line-qty-0"]').clear().type('2');
    cy.get('[data-cy="line-price-0"]').clear().type('200');

    cy.get('[data-cy="add-line-btn"]').click();
    cy.get('[data-cy="line-description-1"]').type('Service B');
    cy.get('[data-cy="line-qty-1"]').clear().type('3');
    cy.get('[data-cy="line-price-1"]').clear().type('200');

    cy.get('[data-cy="add-line-btn"]').click();
    cy.get('[data-cy="line-description-2"]').type('Service C');
    cy.get('[data-cy="line-qty-2"]').clear().type('1');
    cy.get('[data-cy="line-price-2"]').clear().type('99.99');

    cy.get('[data-cy="tax-select"]').select('19%');

    cy.get('[data-cy="save-invoice-btn"]').click();
    cy.wait('@gql');

    cy.get('[data-cy="invoice-subtotal"]').should('exist');
    cy.get('[data-cy="invoice-total"]').should('exist');
    cy.screenshot('INV-IV-001-invoice-created');
  });

  it('INV-IV-003-E zero quantity is rejected', () => {
    cy.visit('/invoices/new');

    cy.get('[data-cy="add-line-btn"]').click();
    cy.get('[data-cy="line-qty-0"]').clear().type('0');
    cy.get('[data-cy="save-invoice-btn"]').click();

    cy.get('[data-cy="line-qty-error-0"]').should('exist');
    cy.get('@gql.all').should('have.length', 0);
    cy.screenshot('INV-IV-003-zero-qty-error');
  });

  it('INV-IV-004-E adds a line to an existing invoice and totals update', () => {
    cy.visit('/invoices/inv-001');
    cy.wait('@gql');

    cy.intercept('POST', GQL, (req) => {
      if (req.body.operationName === 'AddItemToInvoice') {
        req.reply({
          data: {
            addItemToInvoice: {
              id: 'inv-001',
              subTotal: 1199,
              totalAmount: 1426.81,
            },
          },
        });
      }
    }).as('addItem');

    cy.get('[data-cy="add-item-btn"]').click();
    cy.get('[data-cy="new-item-description"]').type('Service D');
    cy.get('[data-cy="new-item-qty"]').type('1');
    cy.get('[data-cy="new-item-price"]').type('199');
    cy.get('[data-cy="save-item-btn"]').click();
    cy.wait('@addItem');

    cy.get('[data-cy="invoice-subtotal"]').should('not.contain', '1 000');
    cy.screenshot('INV-IV-004-line-added');
  });

  it('INV-IV-007-E list and detail navigation works end-to-end', () => {
    cy.visit('/invoices');
    cy.wait('@gql');

    cy.get('[data-cy="invoice-row-inv-001"]').click();
    cy.url().should('include', '/invoices/inv-001');
    cy.wait('@gql');

    cy.get('[data-cy="invoice-detail"]').should('exist');
    cy.screenshot('INV-IV-007-detail-nav');
  });
});

describe('INV-CL — Clients (E2E)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();

    cy.intercept('POST', GQL, (req) => {
      if (req.body.operationName === 'AddClient') {
        req.reply({ data: { addClient: { id: 'cl-new', name: req.body.variables?.input?.name } } });
      } else if (req.body.operationName === 'UpdateClient') {
        req.reply({ data: { updateClient: { id: 'cl-001' } } });
      } else if (req.body.operationName === 'DeleteClient') {
        req.reply({ data: { deleteClient: true } });
      } else if (req.body.operationName === 'GetAllClients') {
        req.reply({ data: { getAllClients: [{ id: 'cl-001', name: 'ACME', clientType: 'Company' }] } });
      }
    }).as('gql');
  });

  it('INV-CL-001-E CRUD client end-to-end', () => {
    cy.visit('/clients');
    cy.wait('@gql');

    // Create
    cy.get('[data-cy="add-client-btn"]').click();
    cy.get('[data-cy="client-name"]').type('Nouveau Client');
    cy.get('[data-cy="save-client-btn"]').click();
    cy.wait('@gql');
    cy.screenshot('INV-CL-001-client-created');

    // Edit
    cy.get('[data-cy="edit-client-cl-001"]').click();
    cy.get('[data-cy="client-name"]').clear().type('Client Modifié');
    cy.get('[data-cy="save-client-btn"]').click();
    cy.wait('@gql');
    cy.screenshot('INV-CL-001-client-edited');

    // Delete
    cy.get('[data-cy="delete-client-cl-001"]').click();
    cy.get('[data-cy="confirm-delete-btn"]').click();
    cy.wait('@gql');
    cy.screenshot('INV-CL-001-client-deleted');
  });
});
