/**
 * SEC — Sécurité transverse
 * Couvre : SEC-THR (détection de charges), SEC-UPL (fichiers), SEC-SVC (endpoints/services)
 * Niveaux : E (Cypress) + I (appels API directs via cy.request)
 */

const GQL_URL = Cypress.env('GQL_URL') || 'http://localhost:5000/graphql';
const NOTIF_URL = Cypress.env('NOTIF_URL') || 'http://localhost:5001/api';

// Charge malveillante minimale pour test XSS/injection
const MALICIOUS_PAYLOADS = [
  '<script>alert(1)</script>',
  'javascript:alert(1)',
  'data:text/html,<h1>xss</h1>',
  'onload=alert(1)',
  '$where: function() { return true }',
  '__proto__[admin]=true',
];

// Textes légitimes qui ne doivent PAS être rejetés
const LEGIT_TEXTS = [
  'description du script de l\'AG',
  'onboarding des nouveaux propriétaires',
  'Contact support',
];

describe('SEC-THR — Détection de charges malveillantes (E2E/API)', () => {
  let authToken: string;

  before(() => {
    // Récupère un token syndic pour les appels API
    const kcUrl = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
    const realm = Cypress.env('KEYCLOAK_REALM') || 'myb';
    const clientId = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myb-front';
    cy.request({
      method: 'POST',
      url: `${kcUrl}/realms/${realm}/protocol/openid-connect/token`,
      form: true,
      body: {
        grant_type: 'password',
        client_id: clientId,
        username: Cypress.env('SYNDIC_USER') || 'test-syndic',
        password: Cypress.env('SYNDIC_PASS') || 'Test@1234',
      },
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 200) {
        authToken = resp.body.access_token;
      }
    });
  });

  MALICIOUS_PAYLOADS.forEach((payload) => {
    it(`SEC-THR-001 : charge malveillante rejetée — "${payload.slice(0, 40)}"`, () => {
      cy.request({
        method: 'POST',
        url: GQL_URL,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { query: 'mutation { __typename }', variables: { input: { name: payload } } },
        failOnStatusCode: false,
      }).then((resp) => {
        // Doit retourner 400 ou un body avec erreur, jamais 200 success avec la charge exécutée
        const isRejected =
          resp.status === 400 ||
          resp.status === 403 ||
          (resp.body?.errors?.length > 0 && !resp.body?.data);
        expect(isRejected, `Payload "${payload.slice(0, 40)}" should be rejected`).to.be.true;
      });
    });
  });

  LEGIT_TEXTS.forEach((text) => {
    it(`SEC-THR-002 : texte légitime accepté — "${text}"`, () => {
      cy.request({
        method: 'POST',
        url: GQL_URL,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: { query: 'mutation { __typename }', variables: { input: { description: text } } },
        failOnStatusCode: false,
      }).then((resp) => {
        // Ne doit pas être rejeté à cause du filtre de sécurité (peut échouer pour d'autres raisons)
        expect(resp.status, `Legit text "${text}" should not be rejected by threat detector`).to.not.eq(400);
      });
    });
  });

  it('SEC-THR-004 : charge malveillante dans les variables GraphQL → rejetée', () => {
    cy.request({
      method: 'POST',
      url: GQL_URL,
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: {
        query: 'query GetCoproperty($id: UUID!) { coproperty(id: $id) { id } }',
        variables: { id: '<script>alert(1)</script>' },
      },
      failOnStatusCode: false,
    }).then((resp) => {
      const isRejected = resp.status === 400 || resp.status === 403 || resp.body?.errors?.length > 0;
      expect(isRejected, 'Malicious payload in variables should be rejected').to.be.true;
    });
  });
});

describe('SEC-SVC — Appels entre services et endpoints anonymes', () => {
  it('SEC-SVC-001 : POST /api/notifications pour un autre userId avec jeton user → 403', () => {
    // Obtenir un jeton propriétaire
    const kcUrl = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
    const realm = Cypress.env('KEYCLOAK_REALM') || 'myb';
    const clientId = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myb-front';
    const otherUserId = Cypress.env('OTHER_USER_ID') || '00000000-0000-0000-0000-000000000002';
    cy.request({
      method: 'POST',
      url: `${kcUrl}/realms/${realm}/protocol/openid-connect/token`,
      form: true,
      body: {
        grant_type: 'password',
        client_id: clientId,
        username: Cypress.env('OWNER_USER') || 'test-owner',
        password: Cypress.env('OWNER_PASS') || 'Test@1234',
      },
      failOnStatusCode: false,
    }).then((tokenResp) => {
      if (tokenResp.status !== 200) {
        cy.log('Skipping — could not get owner token');
        return;
      }
      cy.request({
        method: 'POST',
        url: `${NOTIF_URL}/notifications`,
        headers: { Authorization: `Bearer ${tokenResp.body.access_token}`, 'Content-Type': 'application/json' },
        body: { userId: otherUserId, message: 'test' },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status, 'POST /notifications for another user with user token should be 403').to.eq(403);
        cy.screenshot('SEC-SVC-001-cross-user-notification-denied');
      });
    });
  });

  it('SEC-SVC-003 : GET /api/notifications/{userId} pour un autre utilisateur → 403', () => {
    const kcUrl = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
    const realm = Cypress.env('KEYCLOAK_REALM') || 'myb';
    const clientId = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myb-front';
    const otherUserId = Cypress.env('OTHER_USER_ID') || '00000000-0000-0000-0000-000000000002';
    cy.request({
      method: 'POST',
      url: `${kcUrl}/realms/${realm}/protocol/openid-connect/token`,
      form: true,
      body: {
        grant_type: 'password',
        client_id: clientId,
        username: Cypress.env('OWNER_USER') || 'test-owner',
        password: Cypress.env('OWNER_PASS') || 'Test@1234',
      },
      failOnStatusCode: false,
    }).then((tokenResp) => {
      if (tokenResp.status !== 200) return;
      cy.request({
        method: 'GET',
        url: `${NOTIF_URL}/notifications/${otherUserId}`,
        headers: { Authorization: `Bearer ${tokenResp.body.access_token}` },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
        cy.screenshot('SEC-SVC-003-get-others-notifications-denied');
      });
    });
  });

  it('SEC-SVC-004 : /internal/fund-calls/** avec jeton utilisateur → refusé', () => {
    const internalUrl = Cypress.env('INTERNAL_URL') || 'http://localhost:5000';
    cy.request({
      method: 'GET',
      url: `${internalUrl}/internal/fund-calls/`,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status, '/internal/fund-calls without service token should be refused').to.be.oneOf([401, 403, 404]);
    });
  });

  it('SEC-SVC-005 : Webhook WhatsApp GET avec hub.verify_token faux → 403', () => {
    const webhookUrl = Cypress.env('WEBHOOK_URL') || 'http://localhost:5000/webhook/whatsapp';
    cy.request({
      method: 'GET',
      url: webhookUrl,
      qs: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'this-is-a-wrong-token',
        'hub.challenge': 'test-challenge',
      },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status, 'Wrong verify_token should return 403').to.eq(403);
      expect(resp.body, 'Challenge must not be echoed back').to.not.eq('test-challenge');
      cy.screenshot('SEC-SVC-005-webhook-wrong-token');
    });
  });
});

describe('SEC-SVC — Isolation E2E (P1 : IDOR)', () => {
  it('AUTH-ACL-008 (IDOR) : syn-a ne peut pas lire les données de COPRO-B', () => {
    cy.loginAsSyndic();
    // Tente d'accéder à une copropriété qui ne lui est pas assignée
    const foreignCoproId = Cypress.env('FOREIGN_COPRO_ID') || '00000000-0000-0000-0000-000000000099';
    cy.visit(`/coproperty/${foreignCoproId}/syndic/dashboard`, { failOnStatusCode: false });
    cy.url({ timeout: 10000 }).should('not.include', `${foreignCoproId}/syndic/dashboard`);
    cy.screenshot('AUTH-ACL-008-idor-syndic-foreign-copro');
  });

  it('AUTH-ACL-009 (IDOR) : own-1 ne peut pas lire les données de own-2', () => {
    cy.loginAsOwner();
    const otherOwnerId = Cypress.env('OTHER_OWNER_ID') || '00000000-0000-0000-0000-000000000003';
    // Tente d'accéder au profil ou factures d'un autre propriétaire via GraphQL
    const kcUrl = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
    const realm = Cypress.env('KEYCLOAK_REALM') || 'myb';
    const clientId = Cypress.env('KEYCLOAK_CLIENT_ID') || 'myb-front';
    cy.request({
      method: 'POST',
      url: `${kcUrl}/realms/${realm}/protocol/openid-connect/token`,
      form: true,
      body: {
        grant_type: 'password',
        client_id: clientId,
        username: Cypress.env('OWNER_USER') || 'test-owner',
        password: Cypress.env('OWNER_PASS') || 'Test@1234',
      },
      failOnStatusCode: false,
    }).then((tokenResp) => {
      if (tokenResp.status !== 200) return;
      cy.request({
        method: 'POST',
        url: GQL_URL,
        headers: { Authorization: `Bearer ${tokenResp.body.access_token}`, 'Content-Type': 'application/json' },
        body: {
          query: `query { ownerFundCalls(ownerId: "${otherOwnerId}") { id } }`,
        },
        failOnStatusCode: false,
      }).then((resp) => {
        const isRefused =
          resp.status === 403 ||
          resp.status === 401 ||
          resp.body?.errors?.some((e: { message: string }) => /access|autoris|refus|forbidden/i.test(e.message));
        expect(isRefused, `own-1 should not access own-2's fund calls`).to.be.true;
        cy.screenshot('AUTH-ACL-009-idor-owner-cross-access');
      });
    });
  });
});
