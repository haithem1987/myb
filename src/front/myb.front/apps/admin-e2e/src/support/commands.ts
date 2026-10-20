/// <reference types="cypress" />

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    login(email: string, password: string): void;
    loginAsSyndic(): void;
    loginAsOwner(): void;
    loginAsAdmin(): void;
    loginAsAccountant(): void;
    loginAsCouncil(): void;
    logout(): void;
    goToSyndicSection(section: string, coproId?: string): void;
    goToOwnerSection(section: string, coproId?: string): void;
    interceptGraphQL(operationName: string, fixture: object): void;
  }
}

const COPRO_A = () => (Cypress.env('COPRO_A_ID') as string) || '51a7c8f9-cddc-4e41-89ce-3f336fd2272b';
const KC_URL = Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080';
const KC_REALM = Cypress.env('KEYCLOAK_REALM') || 'MYB';

Cypress.Commands.add('goToSyndicSection', (section: string, coproId?: string) => {
  cy.visit(`/coproperty/${coproId ?? COPRO_A()}/syndic/${section}`);
  cy.wait(300);
});

Cypress.Commands.add('goToOwnerSection', (section: string, coproId?: string) => {
  cy.visit(`/coproperty/${coproId ?? COPRO_A()}/owner/${section}`);
  cy.wait(300);
});

Cypress.Commands.add('interceptGraphQL', (operationName: string, fixture: object) => {
  cy.intercept('POST', '**/graphql', (req) => {
    if (req.body?.operationName === operationName) {
      req.reply({ data: fixture });
    }
  });
});

/**
 * Token-injection login: gets tokens via Keycloak password grant (Node.js task,
 * bypasses required-action / email-verification gates), seeds them in localStorage
 * under __cypress_kc_token, then visits the app. keycloak.service.ts reads that
 * key and passes the tokens straight to keycloak-js init(), skipping the auth flow.
 */
function loginWithCredentials(username: string, password: string): void {
  cy.session(
    [username, password],
    () => {
      cy.task('getKeycloakToken', { username, password }).then((tokens: any) => {
        // onBeforeLoad injects the token BEFORE Angular bootstraps so init() reads it immediately
        cy.visit('/coproperty/select', {
          onBeforeLoad(win) {
            win.localStorage.setItem('__cypress_kc_token', JSON.stringify(tokens));
          },
        });
        cy.url({ timeout: 20000 }).should('match', /localhost:4200.*coproperty/);
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.visit('/coproperty/select');
        cy.url({ timeout: 10000 }).should('match', /localhost:4200.*coproperty/);
      },
    }
  );
}

Cypress.Commands.add('login', (email, password) => {
  loginWithCredentials(email, password);
});

Cypress.Commands.add('loginAsSyndic', () => {
  const user = Cypress.env('SYNDIC_USER') || 'syndic.ellyssa@ellyssa.test';
  const pass = Cypress.env('SYNDIC_PASS') || 'TestPass1234';
  loginWithCredentials(user, pass);
});

Cypress.Commands.add('loginAsOwner', () => {
  const user = Cypress.env('OWNER_USER') || 'owner.apt001@ellyssa.test';
  const pass = Cypress.env('OWNER_PASS') || 'TestPass1234';
  loginWithCredentials(user, pass);
});

Cypress.Commands.add('loginAsAdmin', () => {
  const user = Cypress.env('ADMIN_USER') || 'syndic@myb-test.com';
  const pass = Cypress.env('ADMIN_PASS') || 'TestPass1234';
  loginWithCredentials(user, pass);
});

Cypress.Commands.add('loginAsAccountant', () => {
  const user = Cypress.env('ACCOUNTANT_USER') || 'syndic.ellyssa@ellyssa.test';
  const pass = Cypress.env('ACCOUNTANT_PASS') || 'TestPass1234';
  loginWithCredentials(user, pass);
});

Cypress.Commands.add('loginAsCouncil', () => {
  const user = Cypress.env('COUNCIL_USER') || 'owner.apt001@ellyssa.test';
  const pass = Cypress.env('COUNCIL_PASS') || 'TestPass1234';
  loginWithCredentials(user, pass);
});

Cypress.Commands.add('logout', () => {
  cy.clearAllCookies();
  cy.clearAllLocalStorage();
  cy.clearAllSessionStorage();
});
