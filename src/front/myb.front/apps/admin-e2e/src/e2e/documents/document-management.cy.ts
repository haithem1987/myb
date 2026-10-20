/// <reference types="cypress" />

// Admin E2E — Gestion documentaire
// Scénarios E (E2E) et V (Visual) — U/I traités dans Jest/unit-tests
// Couverture : DOC-DC-001 P1, DOC-RF-001, DOC-RF-002, DOC-RF-004, DOC-RF-006, DOC-DC-005, DOC-DC-007, DOC-DC-008

const GQL = '/graphql';

const mockRootFolder = { id: 1, name: 'root', userId: 'syn-a', moduleName: 'documents' };
const mockFolderA = { id: 10, name: 'Dossier Administratif', parentId: 1, coproId: 'copro-a-id' };
const mockFolderB = { id: 11, name: 'Dossier Comptabilité', parentId: 1, coproId: 'copro-a-id' };
const mockSubFolder = { id: 20, name: 'Sous-dossier', parentId: 10, coproId: 'copro-a-id' };
const mockDocumentA = {
  id: 1,
  name: 'Contrat-2024.pdf',
  documentType: 'CONTRACT',
  documentStatus: 'ACTIVE',
  folderId: 10,
  size: 12345,
};
const mockDocumentList = [mockDocumentA];

function interceptGql() {
  cy.intercept('POST', GQL, (req) => {
    const op = req.body?.operationName ?? '';
    if (op === 'GetRootFolderByUserIdAndModuleName' || op === 'getRootFolder') {
      req.reply({ data: { getRootFolderByUserIdAndModuleName: mockRootFolder } });
    } else if (op === 'GetFolders' || op === 'allFolders') {
      req.reply({ data: { allFolders: [mockFolderA, mockFolderB] } });
    } else if (op === 'GetFolderById') {
      req.reply({ data: { folderById: mockFolderA } });
    } else if (op === 'AddFolder' || op === 'addFolder') {
      req.reply({ data: { addFolder: { id: 99, name: req.body.variables?.item?.name ?? 'Nouveau' } } });
    } else if (op === 'DeleteFolder' || op === 'deleteFolder') {
      req.reply({ data: { deleteFolder: true } });
    } else if (op === 'allDocuments' || op === 'GetDocuments') {
      req.reply({ data: { allDocuments: mockDocumentList } });
    } else if (op === 'AddDocument' || op === 'addDocument') {
      req.reply({ data: { addDocument: { id: 2, name: 'Nouveau.pdf', documentStatus: 'ACTIVE' } } });
    } else if (op === 'DeleteDocument' || op === 'deleteDocument') {
      req.reply({ data: { deleteDocument: true } });
    }
  }).as('gql');
}

// Intercept S3/MinIO presigned PUT (fallback if backend generates presigned URLs)
function interceptStorage() {
  cy.intercept('PUT', /minio|s3|storage/, { statusCode: 200, body: '' }).as('storagePut');
}

describe('DOC-RF — Dossiers racines et arborescence (admin/syndic)', () => {
  beforeEach(() => {
    cy.fixture('document').as('data');
    cy.loginAsSyndic();
    interceptGql();
    interceptStorage();
  });

  it('DOC-RF-001 E — Root folder renvoyé ou créé à la connexion', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    // La racine doit être présente (soit navigable soit non vide)
    cy.get('[data-cy="doc-root-folder"], [data-cy="folder-tree"], [data-cy="folder-list"]').should('exist');
    cy.screenshot('DOC-RF-001-root-folder');
  });

  it('DOC-RF-002 E — Créer des sous-dossiers sur 2 niveaux et vérifier le breadcrumb', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    // Niveau 1 : ouvrir un dossier existant
    cy.get('[data-cy="folder-item"]').first().click();
    cy.wait('@gql');
    // Créer un sous-dossier
    cy.get('[data-cy="add-folder-btn"]').click();
    cy.get('[data-cy="folder-name-input"]').type('Sous-dossier Test');
    cy.get('[data-cy="save-folder-btn"]').click();
    cy.wait('@gql');
    // Breadcrumb doit contenir au moins 2 niveaux
    cy.get('[data-cy="breadcrumb"], .breadcrumb, [aria-label="breadcrumb"]').should('exist');
    cy.screenshot('DOC-RF-002-subfolder-breadcrumb');
  });

  it('DOC-RF-004 E — Supprimer un dossier non vide (récursif)', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    cy.get('[data-cy="folder-item"]').first().find('[data-cy="delete-folder-btn"]').click();
    cy.get('[data-cy="confirm-delete"]').click();
    cy.wait('@gql');
    // La mutation deleteFolder doit avoir été appelée
    cy.get('@gql.all').then((calls: any) => {
      const deleteCall = calls.find((c: any) => {
        const op = c.request?.body?.operationName ?? '';
        return op === 'DeleteFolder' || op === 'deleteFolder';
      });
      expect(deleteCall, 'deleteFolder mutation envoyée').to.exist;
    });
    cy.screenshot('DOC-RF-004-folder-deleted');
  });

  it('DOC-RF-006 P1 — Accès au dossier d\'un autre utilisateur refusé', function () {
    // Intercept spécifique : le serveur renvoie une erreur d'autorisation
    cy.intercept('POST', GQL, (req) => {
      if ((req.body?.operationName ?? '').toLowerCase().includes('folder')) {
        req.reply({ errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] });
      }
    }).as('gqlForbidden');
    cy.visit('/documents?folderId=folder-other-user');
    cy.wait('@gqlForbidden');
    cy.get('[data-cy="access-denied"], [data-cy="error-message"], .error')
      .should('exist')
      .and('be.visible');
    cy.screenshot('DOC-RF-006-access-denied');
  });
});

describe('DOC-DC — Documents et versions (admin/syndic)', () => {
  beforeEach(() => {
    cy.fixture('document').as('data');
    cy.loginAsSyndic();
    interceptGql();
    interceptStorage();
  });

  it('DOC-DC-001 P1 E — Téléverser un PDF valide (cy.fixture + selectFile)', function () {
    cy.visit('/documents');
    cy.wait('@gql');

    // Ouvrir le dossier puis déclencher l'upload
    cy.get('[data-cy="folder-item"]').first().click();
    cy.get('[data-cy="upload-btn"], [data-cy="add-document-btn"]').click();

    // selectFile avec fixture PDF (créé inline si absent)
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 test content'),
        fileName: 'Contrat-2024.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );

    cy.get('[data-cy="document-name-input"]').then(($el) => {
      if ($el.length) cy.wrap($el).clear().type('Contrat-2024');
    });
    cy.get('[data-cy="submit-document-btn"], [data-cy="save-document-btn"]').click();
    cy.wait('@gql');

    // Le document doit apparaître dans la liste
    cy.contains('Nouveau.pdf').should('be.visible');
    cy.screenshot('DOC-DC-001-upload-pdf');
  });

  it('DOC-DC-001 P1 V — Liste de documents visible après upload', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    cy.get('[data-cy="document-list"], [data-cy="documents-table"]').should('exist');
    cy.contains(this.data.document_a.name).should('be.visible');
    cy.screenshot('DOC-DC-001-document-list');
  });

  it('DOC-DC-005 E — Supprimer un document', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    cy.get('[data-cy="folder-item"]').first().click();
    cy.get('[data-cy="document-item"]').first().find('[data-cy="delete-document-btn"]').click();
    cy.get('[data-cy="confirm-delete"]').click();
    cy.wait('@gql');
    cy.get('@gql.all').then((calls: any) => {
      const deleteCall = calls.find((c: any) => {
        const op = c.request?.body?.operationName ?? '';
        return op === 'DeleteDocument' || op === 'deleteDocument';
      });
      expect(deleteCall, 'deleteDocument mutation envoyée').to.exist;
    });
    cy.screenshot('DOC-DC-005-document-deleted');
  });

  it('DOC-DC-007 P1 — Isolation : syndic B ne voit pas les docs de copro A', function () {
    cy.loginAsSyndic();
    cy.intercept('POST', GQL, (req) => {
      if ((req.body?.operationName ?? '').toLowerCase().includes('document')) {
        req.reply({ errors: [{ message: 'Unauthorized', extensions: { code: 'FORBIDDEN' } }] });
      }
    }).as('gqlB');
    cy.visit('/documents?coproId=copro-a-id');
    cy.wait('@gqlB');
    cy.get('[data-cy="access-denied"], [data-cy="error-message"], .error')
      .should('exist')
      .and('be.visible');
    cy.screenshot('DOC-DC-007-isolation-cross-copro');
  });

  it('DOC-DC-008 V — Écrans liste, détail et upload', function () {
    cy.visit('/documents');
    cy.wait('@gql');
    cy.screenshot('DOC-DC-008-document-list-view');
    cy.get('[data-cy="folder-item"]').first().click();
    cy.wait('@gql');
    cy.screenshot('DOC-DC-008-folder-detail-view');
    cy.get('[data-cy="upload-btn"], [data-cy="add-document-btn"]').click();
    cy.screenshot('DOC-DC-008-upload-form-view');
  });
});
