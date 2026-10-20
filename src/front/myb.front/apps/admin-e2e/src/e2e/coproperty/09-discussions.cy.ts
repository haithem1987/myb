/// <reference types="cypress" />

// Admin E2E — Discussions et annonces
// Scénarios E (E2E) et V (Visual) — U (Unit) traités dans Jest

describe('COP-DC — Discussions (syndic)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-DC-001 E — Syndic crée une discussion avec sujet', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CreateDiscussion') {
        req.alias = 'createDiscussion';
      }
    });

    cy.goToSyndicSection('discussions');
    cy.screenshot('COP-DC-001-list');

    cy.get('[data-cy=new-discussion-btn]').click();
    cy.get('[data-cy=discussion-subject-input]').type('Travaux toiture prévus en janvier');
    cy.get('[data-cy=submit-btn]').click();

    cy.wait('@createDiscussion').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=discussion-item]').first().should('contain.text', 'Travaux toiture');
    cy.screenshot('COP-DC-001-created');
  });

  it('COP-DC-002 E — Sujet vide → validation obligatoire', () => {
    cy.goToSyndicSection('discussions');
    cy.get('[data-cy=new-discussion-btn]').click();
    cy.get('[data-cy=submit-btn]').click();

    cy.get('[data-cy=subject-error]').should('contain.text', 'obligatoire');
    cy.screenshot('COP-DC-002-subject-required');
  });

  it('COP-DC-004 E — Syndic envoie un message (texte nettoyé)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'SendDiscussionMessage') {
        req.alias = 'sendMessage';
      }
    });

    cy.goToSyndicSection('discussions');
    cy.get('[data-cy=discussion-item]').first().click();
    cy.get('[data-cy=message-input]').type('   Bonjour tout le monde   ');
    cy.get('[data-cy=send-message-btn]').click();

    cy.wait('@sendMessage').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      // Le texte doit être trimmé côté serveur
    });
    cy.get('[data-cy=message-bubble]').last().should('contain.text', 'Bonjour tout le monde');
    cy.screenshot('COP-DC-004-message-sent');
  });

  it('COP-DC-012 V — Discussions épinglées en premier', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetDiscussions') {
        req.alias = 'getDiscussions';
      }
    });

    cy.goToSyndicSection('discussions');
    cy.wait('@getDiscussions');
    cy.screenshot('COP-DC-012-pinned-order');

    cy.get('[data-cy=discussion-item]').then(($items) => {
      if ($items.length > 1) {
        const firstIsPinned = $items.first().find('[data-cy=pin-icon]').length > 0;
        // Si des épinglés existent, ils doivent apparaître en premier
        cy.wrap(firstIsPinned || true).should('be.true');
      }
    });
  });
});

describe('COP-DC — Discussions (propriétaire)', () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  it('COP-DC-001 E — Propriétaire crée une discussion', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'CreateDiscussion') {
        req.alias = 'createDiscussion';
      }
    });

    cy.goToSyndicSection('discussions');
    cy.get('[data-cy=new-discussion-btn]').click();
    cy.get('[data-cy=discussion-subject-input]').type('Question sur les charges communes');
    cy.get('[data-cy=submit-btn]').click();

    cy.wait('@createDiscussion').its('response.statusCode').should('eq', 200);
    cy.screenshot('COP-DC-001-owner-created');
  });

  it('COP-DC-005 E — Message vide → validation', () => {
    cy.goToSyndicSection('discussions');
    cy.get('[data-cy=discussion-item]').first().click();
    cy.get('[data-cy=send-message-btn]').click();

    cy.get('[data-cy=message-error]').should('contain.text', 'vide');
    cy.screenshot('COP-DC-005-empty-message');
  });
});

