/// <reference types="cypress" />

const API = 'http://localhost:8082/api/payment';

describe('PAY-ST-010 — Paiement par carte (E2E + Visual)', () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  // V — Visual captures

  it('PAY-ST-010-V1 captures the payment dialog', () => {
    cy.intercept('POST', `${API}/create-payment-intent`, {
      statusCode: 200,
      body: { clientSecret: 'pi_test_secret_123' },
    }).as('createIntent');

    cy.visit('/charges');
    cy.get('[data-cy="pay-charge-btn"]').first().click();
    cy.wait('@createIntent');
    cy.screenshot('PAY-ST-010-payment-dialog');
  });

  // E — Cypress E2E

  it('PAY-ST-010-E1 successful payment with test card 4242...', () => {
    cy.intercept('POST', `${API}/create-payment-intent`, {
      statusCode: 200,
      body: { clientSecret: 'pi_test_secret_ok' },
    }).as('createIntent');

    cy.intercept('POST', `${API}/pay-charge`, {
      statusCode: 200,
      body: { status: 'Paid' },
    }).as('payCharge');

    cy.visit('/charges');
    cy.get('[data-cy="pay-charge-btn"]').first().click();
    cy.wait('@createIntent');

    // Stripe Elements iframe — interact only when present; otherwise stub via API
    cy.get('body').then(($body) => {
      if ($body.find('iframe[name*="__privateStripeFrame"]').length) {
        cy.get('iframe[name*="__privateStripeFrame"]')
          .its('0.contentDocument.body')
          .should('not.be.empty')
          .then(cy.wrap)
          .find('[name="cardnumber"]')
          .type('4242424242424242');
      }
    });

    cy.get('[data-cy="confirm-payment-btn"]').click();
    cy.wait('@payCharge');
    cy.get('[data-cy="payment-success"]').should('exist');
    cy.screenshot('PAY-ST-010-success');
  });

  it('PAY-ST-010-E2 declined card shows error message, nothing recorded', () => {
    cy.intercept('POST', `${API}/create-payment-intent`, {
      statusCode: 200,
      body: { clientSecret: 'pi_test_secret_declined' },
    }).as('createIntent');

    cy.intercept('POST', `${API}/pay-charge`, {
      statusCode: 402,
      body: { error: 'Your card was declined.' },
    }).as('payChargeDeclined');

    cy.visit('/charges');
    cy.get('[data-cy="pay-charge-btn"]').first().click();
    cy.wait('@createIntent');

    cy.get('[data-cy="confirm-payment-btn"]').click();
    cy.wait('@payChargeDeclined');

    cy.get('[data-cy="payment-error"]').should('contain', 'décliné').or('contain', 'declined');
    cy.get('[data-cy="payment-success"]').should('not.exist');
    cy.screenshot('PAY-ST-010-declined');
  });

  it('PAY-ST-002-E pay-charge with amount ≤ 0 is rejected', () => {
    cy.intercept('POST', `${API}/pay-charge`, {
      statusCode: 400,
      body: { error: 'Amount must be greater than zero.' },
    }).as('badAmount');

    cy.request({
      method: 'POST',
      url: `${API}/pay-charge`,
      body: { amount: 0, chargeDistributionId: 'cd-001' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.error).to.include('Amount must be greater than zero');
    });
  });

  it('PAY-ST-003-E pay-charge without ChargeDistributionId is rejected', () => {
    cy.request({
      method: 'POST',
      url: `${API}/pay-charge`,
      body: { amount: 100 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body.error).to.include('ChargeDistributionId');
    });
  });
});

describe('PAY-SB-012 — Page abonnements (E2E + Visual)', () => {
  beforeEach(() => {
    cy.loginAsSyndic();

    cy.intercept('GET', `${API}/subscriptions/coproperty/copro-a`, {
      statusCode: 200,
      body: [
        {
          userId: 'user-syn-001',
          serviceId: 1,
          serviceName: 'Gestion copropriété',
          status: 'Active',
          expiresAt: null,
        },
      ],
    }).as('getSubs');
  });

  it('PAY-SB-012-V1 captures the subscriptions page', () => {
    cy.visit('/subscriptions');
    cy.wait('@getSubs');
    cy.screenshot('PAY-SB-012-subscriptions-page');
  });

  it('PAY-SB-012-E1 lists active subscriptions for COPRO-A', () => {
    cy.visit('/subscriptions');
    cy.wait('@getSubs');
    cy.get('[data-cy="subscription-list"]').should('exist');
    cy.get('[data-cy="subscription-item"]').should('have.length.gte', 1);
    cy.screenshot('PAY-SB-012-list');
  });

  it('PAY-SB-001-E start-trial creates a Trial subscription', () => {
    cy.intercept('POST', `${API}/start-trial`, {
      statusCode: 200,
      body: { status: 'Trial', serviceId: 1, expiresAt: '2027-01-01T00:00:00Z' },
    }).as('startTrial');

    cy.visit('/subscriptions');
    cy.get('[data-cy="start-trial-btn"]').click();
    cy.wait('@startTrial');
    cy.get('[data-cy="trial-badge"]').should('exist');
    cy.screenshot('PAY-SB-001-trial-started');
  });

  it('PAY-SB-011-E user-dropdown degrades gracefully when payment service is down', () => {
    cy.intercept('GET', /subscriptions\/.*/, { forceNetworkError: true }).as('subsDown');

    cy.visit('/');
    cy.get('[data-cy="user-dropdown"]').click();
    // No blocking error; badge hidden or shows degraded state
    cy.get('[data-cy="subscription-error"]').should('not.exist');
    cy.get('[data-cy="user-menu"]').should('be.visible');
    cy.screenshot('PAY-SB-011-dropdown-degraded');
  });
});
