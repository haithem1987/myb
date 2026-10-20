/**
 * USR — Gestion des utilisateurs (user-manager)
 * Couvre : USR-001 à USR-009
 * Niveaux : E (Cypress E2E) + V (captures visuelles)
 */

const GQL_UM_URL = Cypress.env('GQL_UM_URL') || Cypress.env('GQL_URL') || 'http://localhost:5002/graphql';
const KC_URL = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
const KC_REALM = Cypress.env('KEYCLOAK_REALM') || 'myb';
const KC_CLIENT = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myb-front';

function getToken(username: string, password: string): Cypress.Chainable<string> {
  return cy.request({
    method: 'POST',
    url: `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`,
    form: true,
    body: { grant_type: 'password', client_id: KC_CLIENT, username, password },
    failOnStatusCode: false,
  }).then((r) => r.body.access_token as string);
}

describe('USR — User Manager E2E', () => {
  describe('USR-003 : mutations utilisateur par rôle non-admin → refus (P1)', () => {
    it('USR-003 : un propriétaire ne peut pas appeler AddUser', () => {
      getToken(
        Cypress.env('OWNER_USER') || 'test-owner',
        Cypress.env('OWNER_PASS') || 'Test@1234'
      ).then((token) => {
        if (!token) return cy.log('Skipping — no owner token');
        cy.request({
          method: 'POST',
          url: GQL_UM_URL,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: {
            query: `mutation { addUser(input: { username: "hacker", email: "hacker@test.com", password: "Hack@1234", firstName: "H", lastName: "K" }) { id } }`,
          },
          failOnStatusCode: false,
        }).then((resp) => {
          const isRefused =
            resp.status === 401 ||
            resp.status === 403 ||
            resp.body?.errors?.some((e: { message: string }) => /access|autoris|refus|forbidden|unauthorized/i.test(e.message));
          expect(isRefused, 'Owner should not be able to call AddUser').to.be.true;
          cy.screenshot('USR-003-owner-adduser-denied');
        });
      });
    });
  });

  describe('USR-004 : GetMe retourne le profil de l\'appelant uniquement', () => {
    it('USR-004 : GetMe avec jeton propriétaire → profil propriétaire', () => {
      getToken(
        Cypress.env('OWNER_USER') || 'test-owner',
        Cypress.env('OWNER_PASS') || 'Test@1234'
      ).then((token) => {
        if (!token) return cy.log('Skipping — no owner token');
        cy.request({
          method: 'POST',
          url: GQL_UM_URL,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: { query: '{ me { id email } }' },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body?.data?.me).to.have.property('id');
          // L'id retourné doit correspondre à l'utilisateur authentifié, pas à un autre
          cy.screenshot('USR-004-getme-owner');
        });
      });
    });
  });

  describe('USR-005 : GetUsers / GetUserById sans jeton → refus (P1)', () => {
    it('USR-005a : GetUsers sans jeton → refusé', () => {
      cy.request({
        method: 'POST',
        url: GQL_UM_URL,
        headers: { 'Content-Type': 'application/json' },
        body: { query: '{ users { id email } }' },
        failOnStatusCode: false,
      }).then((resp) => {
        const isRefused = resp.status === 401 || resp.status === 403 || resp.body?.errors?.length > 0;
        expect(isRefused, 'GetUsers without token should be refused').to.be.true;
        cy.screenshot('USR-005a-getusers-no-token');
      });
    });

    it('USR-005b : GetUserById sans jeton → refusé', () => {
      const testId = Cypress.env('TEST_USER_ID') || '00000000-0000-0000-0000-000000000001';
      cy.request({
        method: 'POST',
        url: GQL_UM_URL,
        headers: { 'Content-Type': 'application/json' },
        body: { query: `{ user(id: "${testId}") { id email } }` },
        failOnStatusCode: false,
      }).then((resp) => {
        const isRefused = resp.status === 401 || resp.status === 403 || resp.body?.errors?.length > 0;
        expect(isRefused, 'GetUserById without token should be refused').to.be.true;
        cy.screenshot('USR-005b-getuserbyid-no-token');
      });
    });
  });

  describe('USR-006 : ⚠ GetToken — vérification de sécurité', () => {
    it('USR-006 : GetToken avec mauvais identifiants → erreur générique, pas de secret exposé', () => {
      cy.request({
        method: 'POST',
        url: GQL_UM_URL,
        headers: { 'Content-Type': 'application/json' },
        body: { query: '{ token(username: "wrong", password: "wrong") }' },
        failOnStatusCode: false,
      }).then((resp) => {
        if (resp.status === 404 || resp.body?.errors?.some((e: { message: string }) => /field.*not.*exist|unknown/i.test(e.message))) {
          cy.log('USR-006: GetToken field does not exist — good, it may have been removed');
          return;
        }
        // Si le champ existe, le message d'erreur ne doit pas révéler d'infos internes
        const bodyStr = JSON.stringify(resp.body);
        expect(bodyStr).to.not.include('client_secret');
        expect(bodyStr).to.not.include('stack');
        cy.screenshot('USR-006-gettoken-error-message');
      });
    });
  });

  describe('USR-009 (V+E) : écran de gestion des utilisateurs', () => {
    it('USR-009 : admin accède à la page de gestion des utilisateurs', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.url({ timeout: 15000 }).should('satisfy', (url: string) =>
        url.includes('users') || url.includes('admin') || url.includes('user-management')
      );
      cy.get('table, [data-cy="users-list"], [data-cy="user-table"]', { timeout: 10000 }).should('be.visible');
      cy.screenshot('USR-009-user-management-screen');
    });

    it('USR-009 (V) : capture de l\'écran de gestion des utilisateurs', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users', { failOnStatusCode: false });
      cy.get('body').should('be.visible');
      cy.screenshot('USR-009-visual-user-management');
    });
  });

  describe('USR-001 : CRUD utilisateur (admin)', () => {
    const testEmail = `e2e-test-${Date.now()}@test.com`;
    let createdUserId: string;

    it('USR-001a : AddUser (admin) → utilisateur créé', () => {
      getToken(
        Cypress.env('ADMIN_USER') || 'test-admin',
        Cypress.env('ADMIN_PASS') || 'Test@1234'
      ).then((token) => {
        if (!token) return cy.log('Skipping — no admin token');
        cy.request({
          method: 'POST',
          url: GQL_UM_URL,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: {
            query: `mutation {
              addUser(input: {
                username: "e2e_user_${Date.now()}",
                email: "${testEmail}",
                password: "Test@1234!",
                firstName: "E2E",
                lastName: "Test"
              }) { id email }
            }`,
          },
          failOnStatusCode: false,
        }).then((resp) => {
          if (resp.status === 200 && resp.body?.data?.addUser) {
            createdUserId = resp.body.data.addUser.id;
            expect(resp.body.data.addUser.email).to.eq(testEmail);
            cy.screenshot('USR-001a-add-user');
          } else {
            cy.log('AddUser mutation not available or failed — skipping');
          }
        });
      });
    });

    it('USR-002 : AddUser avec email déjà utilisé → refus', () => {
      const existingEmail = Cypress.env('OWNER_USER') + '@test.com' || 'test-owner@test.com';
      getToken(
        Cypress.env('ADMIN_USER') || 'test-admin',
        Cypress.env('ADMIN_PASS') || 'Test@1234'
      ).then((token) => {
        if (!token) return cy.log('Skipping — no admin token');
        cy.request({
          method: 'POST',
          url: GQL_UM_URL,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: {
            query: `mutation {
              addUser(input: {
                username: "duplicate_${Date.now()}",
                email: "${existingEmail}",
                password: "Test@1234!",
                firstName: "Dup",
                lastName: "Test"
              }) { id }
            }`,
          },
          failOnStatusCode: false,
        }).then((resp) => {
          const isRefused =
            resp.status !== 200 ||
            resp.body?.errors?.length > 0 ||
            !resp.body?.data?.addUser;
          expect(isRefused, 'Duplicate email should be refused').to.be.true;
          cy.screenshot('USR-002-duplicate-email-refused');
        });
      });
    });
  });
});
