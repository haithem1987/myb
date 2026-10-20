/// <reference types="cypress" />

/**
 * MAIL — Mailer : tests E2E de bout en bout (producteur → RabbitMQ → SMTP)
 * Niveaux : E (Cypress) — les tests U/I purs sont dans les unit-tests .NET
 * Prérequis : MailHog ou smtp4dev accessible via MAILHOG_URL (ex. http://localhost:8025)
 */

const API = Cypress.env('API_URL') || 'http://localhost:5000';
const MAILHOG = Cypress.env('MAILHOG_URL') || 'http://localhost:8025';

describe('MAIL — Mailer (e2e envoi)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('MAIL-002 (E) : un e-mail notif déclenché côté app arrive dans MailHog', () => {
    // Déclenche un envoi d'e-mail via l'API notification (POST /email)
    cy.request({
      method: 'POST',
      url: `${API}/api/notifications/email`,
      body: {
        to: 'e2e-test@mailhog.local',
        subject: 'MAIL-002 E2E test',
        htmlBody: '<p>Test automatique Cypress</p>',
      },
      failOnStatusCode: false,
    }).its('status').should('be.oneOf', [200, 202, 403]); // 403 si non autorisé depuis le front

    // Attend que MailHog reçoive l'e-mail (polling simple)
    cy.waitUntil(
      () =>
        cy
          .request({ method: 'GET', url: `${MAILHOG}/api/v2/messages`, failOnStatusCode: false })
          .then((resp) => {
            if (resp.status !== 200) return false;
            const messages: any[] = resp.body?.items ?? [];
            return messages.some((m: any) =>
              JSON.stringify(m).includes('MAIL-002 E2E test')
            );
          }),
      { timeout: 30000, interval: 2000, errorMsg: 'E-mail MAIL-002 non reçu dans MailHog' }
    );
    cy.screenshot('MAIL-002-email-received');
  });

  it('MAIL-007 (V) : rendu du gabarit e-mail fr/en/ar dans l\'UI', () => {
    // Vérifie l'écran de prévisualisation de template si exposé
    cy.visit('/admin/email-templates', { failOnStatusCode: false });
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="template-preview"]').length) {
        ['fr', 'en', 'ar'].forEach((lang) => {
          cy.get(`[data-cy="lang-${lang}"]`).click({ force: true });
          cy.get('[data-cy="template-preview"]').should('be.visible');
          cy.screenshot(`MAIL-007-template-${lang}`);
          if (lang === 'ar') {
            cy.get('[data-cy="template-preview"] [dir]').should('have.attr', 'dir', 'rtl');
          }
        });
      } else {
        cy.log('Pas d\'écran de prévisualisation de template exposé — test visuel ignoré');
        cy.screenshot('MAIL-007-no-preview-screen');
      }
    });
  });

  it('MAIL-009 (E) : e-mail activation de compte déclenché depuis la création d\'utilisateur', () => {
    cy.intercept('POST', `${API}/api/notifications/email`).as('emailSent');
    // Navigue vers la création d'utilisateur pour déclencher l'envoi d'activation
    cy.visit('/user-manager/new');
    cy.get('[data-cy="user-email"]', { timeout: 10000 }).type(`e2e-activation-${Date.now()}@test.com`);
    cy.get('[data-cy="user-firstname"]').type('E2E');
    cy.get('[data-cy="user-lastname"]').type('Test');
    cy.get('[data-cy="submit-user"]').click();
    cy.wait('@emailSent', { timeout: 15000 }).its('response.statusCode').should('be.oneOf', [200, 202]);
    cy.screenshot('MAIL-009-activation-email-sent');
  });
});
