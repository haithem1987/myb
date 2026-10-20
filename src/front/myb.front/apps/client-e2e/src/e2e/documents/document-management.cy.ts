/// <reference types="cypress" />

// Client E2E — Gestion documentaire (espace propriétaire)
// Couverture : DOC-DC-001 P1, DOC-DC-007 P1 (isolation), DOC-RF-001, DOC-RF-006, DOC-DC-008

const GQL = '/graphql';

const OWNER1_EMAIL = 'own-1@test.com';   // appartient à COPRO-A uniquement
const OWNER2_EMAIL = 'own-2@test.com';   // appartient à COPRO-B uniquement
const PASSWORD = 'Test1234!';

const COPRO_A_ID = 'copro-a-id';
const COPRO_B_ID = 'copro-b-id';

const mockRootFolderOwner1 = { id: 100, name: 'root', userId: 'own-1', moduleName: 'documents' };
const mockFolderOwner1 = { id: 110, name: 'Mes Documents', parentId: 100, coproId: COPRO_A_ID };
const mockDocumentOwner1 = {
  id: 1,
  name: 'Titre-propriété.pdf',
  documentType: 'TITLE',
  documentStatus: 'ACTIVE',
  folderId: 110,
  coproId: COPRO_A_ID,
  size: 8192,
};

function interceptGqlOwner(coproId: string) {
  cy.intercept('POST', GQL, (req) => {
    const op = req.body?.operationName ?? '';
    // Reject cross-copropriété document access
    const reqCoproId = req.body?.variables?.coproId ?? req.body?.variables?.item?.coproId ?? '';
    if (reqCoproId && reqCoproId !== coproId) {
      req.reply({ errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] });
      return;
    }
    if (op === 'GetRootFolderByUserIdAndModuleName' || op === 'getRootFolder') {
      req.reply({ data: { getRootFolderByUserIdAndModuleName: mockRootFolderOwner1 } });
    } else if (op === 'GetFolders' || op === 'allFolders') {
      req.reply({ data: { allFolders: [mockFolderOwner1] } });
    } else if (op === 'allDocuments' || op === 'GetDocuments') {
      req.reply({ data: { allDocuments: [mockDocumentOwner1] } });
    } else if (op === 'AddDocument' || op === 'addDocument') {
      req.reply({ data: { addDocument: { id: 99, name: 'Nouveau.pdf', documentStatus: 'ACTIVE', coproId } } });
    } else if (op === 'DeleteDocument' || op === 'deleteDocument') {
      req.reply({ data: { deleteDocument: true } });
    }
  }).as('gql');
}

// Intercept S3/MinIO presigned PUT
function interceptStorage() {
  cy.intercept('PUT', /minio|s3|storage/, { statusCode: 200, body: '' }).as('storagePut');
}

describe('DOC-RF — Dossiers racines (espace propriétaire)', () => {
  beforeEach(() => {
    cy.login(OWNER1_EMAIL, PASSWORD);
    interceptGqlOwner(COPRO_A_ID);
    interceptStorage();
  });

  it('DOC-RF-001 E — Accès à l\'espace documentaire de sa copropriété', () => {
    cy.visit(`/coproperty/${COPRO_A_ID}/owner/documents`);
    cy.wait('@gql');
    cy.get('[data-cy="folder-list"], [data-cy="doc-root-folder"], [data-cy="folder-tree"]').should('exist');
    cy.screenshot('DOC-RF-001-owner-root-folder');
  });

  it('DOC-RF-006 P1 — Accès aux documents d\'une autre copropriété refusé', () => {
    // own-1 tente d'accéder aux docs de COPRO-B
    cy.intercept('POST', GQL, (req) => {
      req.reply({ errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] });
    }).as('gqlForbidden');
    cy.visit(`/coproperty/${COPRO_B_ID}/owner/documents`);
    cy.wait('@gqlForbidden');
    cy.get('[data-cy="access-denied"], [data-cy="error-message"], .error')
      .should('exist')
      .and('be.visible');
    cy.screenshot('DOC-RF-006-owner-cross-copro-denied');
  });
});

describe('DOC-DC — Documents (espace propriétaire)', () => {
  beforeEach(() => {
    cy.login(OWNER1_EMAIL, PASSWORD);
    interceptGqlOwner(COPRO_A_ID);
    interceptStorage();
  });

  it('DOC-DC-001 P1 E — Propriétaire téléverse un PDF dans sa copropriété', () => {
    cy.visit(`/coproperty/${COPRO_A_ID}/owner/documents`);
    cy.wait('@gql');
    cy.get('[data-cy="folder-item"]').first().click();
    cy.get('[data-cy="upload-btn"], [data-cy="add-document-btn"]').click();

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 titre propriété test'),
        fileName: 'Titre-propriété.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );

    cy.get('[data-cy="document-name-input"]').then(($el) => {
      if ($el.length) cy.wrap($el).clear().type('Titre-propriété');
    });
    cy.get('[data-cy="submit-document-btn"], [data-cy="save-document-btn"]').click();
    cy.wait('@gql');
    cy.contains('Nouveau.pdf').should('be.visible');
    cy.screenshot('DOC-DC-001-owner-upload-pdf');
  });

  it('DOC-DC-007 P1 — Isolation : own-1 ne voit que les docs de COPRO-A', () => {
    cy.visit(`/coproperty/${COPRO_A_ID}/owner/documents`);
    cy.wait('@gql');
    // Les documents affichés appartiennent à COPRO-A
    cy.get('[data-cy="document-item"]').each(($el) => {
      cy.wrap($el).should('not.contain.text', 'COPRO-B');
    });
    cy.contains(mockDocumentOwner1.name).should('be.visible');
    cy.screenshot('DOC-DC-007-isolation-owner-copro-a');
  });

  it('DOC-DC-007 P1 — own-1 ne peut pas lister les docs de COPRO-B', () => {
    cy.intercept('POST', GQL, (req) => {
      req.reply({ errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] });
    }).as('gqlDenied');
    cy.visit(`/coproperty/${COPRO_B_ID}/owner/documents`);
    cy.wait('@gqlDenied');
    cy.get('[data-cy="access-denied"], [data-cy="error-message"], .error')
      .should('exist')
      .and('be.visible');
    cy.screenshot('DOC-DC-007-owner-cannot-access-copro-b');
  });

  it('DOC-DC-008 V — Captures écran espace documentaire propriétaire', () => {
    cy.visit(`/coproperty/${COPRO_A_ID}/owner/documents`);
    cy.wait('@gql');
    cy.screenshot('DOC-DC-008-owner-document-list');
    cy.get('[data-cy="folder-item"]').first().click();
    cy.wait('@gql');
    cy.screenshot('DOC-DC-008-owner-folder-detail');
  });
});
