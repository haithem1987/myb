/// <reference types="cypress" />

// Client E2E — Espace propriétaire
// Scénarios E (E2E) et V (Visual) uniquement — U (Unit) traités dans Jest
// baseUrl : http://localhost:4200 (voir cypress.config.ts)

const OWNER_EMAIL = 'owner1@example.com'; // own-1 : lots A101 + A102
const OWNER_PASSWORD = 'Owner1234!';
const OWNER2_EMAIL = 'owner2@example.com'; // own-2 : lot B201, deux copropriétés

describe('COP-RG — Inscription et activation', () => {
  it('COP-RG-001 E — Lien d'activation → complete-profile', () => {
    // Simule un clic sur le lien d'activation reçu par e-mail
    cy.visit('/activate?token=test-activation-token');
    cy.url().should('include', '/complete-profile');
    cy.screenshot('COP-RG-001-complete-profile-redirect');
  });

  it('COP-RG-003 E — Lien expiré : message clair + renvoi', () => {
    cy.visit('/activate?token=expired-token');
    cy.get('[data-cy=activation-error]').should('be.visible');
    cy.get('[data-cy=resend-activation-btn]').should('be.visible');
    cy.screenshot('COP-RG-003-expired-link');
  });

  it('COP-RG-004 E — /register sans profil → registration-path', () => {
    cy.visit('/register');
    cy.url().should('include', '/registration-path');
    cy.screenshot('COP-RG-004-registration-path');
  });

  it('COP-RG-005 E — /register avec profil existant → redirection espace', () => {
    cy.login(OWNER_EMAIL, OWNER_PASSWORD);
    cy.visit('/register');
    cy.url().should('not.include', '/register');
    cy.screenshot('COP-RG-005-already-has-profile-redirect');
  });

  it('COP-RG-006 E,V — Complétion de profil : téléphone + langue', () => {
    cy.login(OWNER_EMAIL, OWNER_PASSWORD);
    cy.visit('/complete-profile');
    cy.get('[data-cy=phone-input]').type('+21612345678');
    cy.get('[data-cy=language-select]').select('fr');
    cy.get('[data-cy=save-profile-btn]').click();
    cy.url().should('not.include', '/complete-profile');
    cy.screenshot('COP-RG-006-profile-completed');
  });
});

describe('COP-PF — Profil propriétaire', () => {
  it('COP-PF-006 E — Changer mot de passe : ancien faux, nouveau faible, puis valide', () => {
    cy.login(OWNER_EMAIL, OWNER_PASSWORD);
    cy.visit('/profile/change-password');

    // Ancien mot de passe incorrect
    cy.get('[data-cy=current-password]').type('WrongPass!');
    cy.get('[data-cy=new-password]').type('newpass');
    cy.get('[data-cy=submit-password-btn]').click();
    cy.get('[data-cy=password-error]').should('be.visible');
    cy.screenshot('COP-PF-006-wrong-old-password');

    // Nouveau mot de passe trop faible
    cy.get('[data-cy=current-password]').clear().type(OWNER_PASSWORD);
    cy.get('[data-cy=new-password]').clear().type('weak');
    cy.get('[data-cy=submit-password-btn]').click();
    cy.get('[data-cy=password-strength-error]').should('be.visible');
    cy.screenshot('COP-PF-006-weak-new-password');

    // Valide
    cy.get('[data-cy=new-password]').clear().type('NewSecure1234!');
    cy.get('[data-cy=confirm-password]').clear().type('NewSecure1234!');
    cy.get('[data-cy=submit-password-btn]').click();
    cy.get('[data-cy=password-success]').should('be.visible');
    cy.screenshot('COP-PF-006-password-changed');
  });

  it('COP-PF-007 V — Page profil : capture de référence', () => {
    cy.login(OWNER_EMAIL, OWNER_PASSWORD);
    cy.visit('/profile');
    cy.get('[data-cy=profile-page]').should('be.visible');
    cy.screenshot('COP-PF-007-profile-page');
  });
});

describe('COP-PO — Portail propriétaire', () => {
  beforeEach(() => {
    cy.login(OWNER_EMAIL, OWNER_PASSWORD);
  });

  it('COP-PO-001 E,V — Mes lots : A101 + A102 uniquement', () => {
    cy.visit('/owner-portal/my-units');
    cy.get('[data-cy=unit-item]').should('have.length', 2);
    cy.get('[data-cy=unit-item]').eq(0).should('contain.text', 'A101');
    cy.get('[data-cy=unit-item]').eq(1).should('contain.text', 'A102');
    // Pas de lots d'autres propriétaires
    cy.get('[data-cy=unit-item]').should('not.contain.text', 'B201');
    cy.screenshot('COP-PO-001-my-units');
  });

  it('COP-PO-002 E,V — Résidence : infos copropriété et contacts syndic', () => {
    cy.visit('/owner-portal/residence');
    cy.get('[data-cy=coproperty-name]').should('be.visible');
    cy.get('[data-cy=syndic-contact]').should('be.visible');
    cy.screenshot('COP-PO-002-residence-info');
  });

  it('COP-PO-003 E,V — Mes charges et répartitions', () => {
    cy.visit('/owner-portal/charges');
    cy.get('[data-cy=charge-row]').should('have.length.at.least', 1);
    cy.get('[data-cy=charge-amount]').first().should('exist');
    cy.screenshot('COP-PO-003-charges');
  });

  it('COP-PO-004 E — Mes factures et déclaration d'un versement', () => {
    cy.visit('/owner-portal/invoices');
    cy.get('[data-cy=invoice-row]').should('have.length.at.least', 1);
    cy.screenshot('COP-PO-004-invoices-list');

    // Déclarer un versement sur la première facture Pending
    cy.get('[data-cy=invoice-row]').first().within(() => {
      cy.get('[data-cy=invoice-status]').then(($status) => {
        if ($status.text().includes('Pending') || $status.text().includes('PartiallyPaid')) {
          cy.get('[data-cy=declare-payment-btn]').click();
        }
      });
    });
    cy.get('[data-cy=payment-declaration-dialog]').should('be.visible');
    cy.get('[data-cy=payment-amount-input]').type('100');
    cy.get('[data-cy=submit-payment-btn]').click();
    cy.screenshot('COP-PO-004-payment-declared');
  });

  it('COP-PO-005 E — Documents de la copropriété', () => {
    cy.visit('/owner-portal/documents');
    cy.get('[data-cy=document-list]').should('be.visible');
    cy.get('[data-cy=document-item]').first().find('[data-cy=download-btn]').click();
    cy.screenshot('COP-PO-005-documents');
  });
});

describe('COP-PO-006 — Propriétaire dans deux copropriétés', () => {
  it('COP-PO-006 E — Passage d'une copropriété à l'autre sans mélange de données', () => {
    cy.login(OWNER2_EMAIL, OWNER2_EMAIL.replace('@example.com', '1234!'));
    cy.visit('/choose-space');
    cy.screenshot('COP-PO-006-choose-space');

    // Sélectionner COPRO-A
    cy.get('[data-cy=coproperty-option]').contains('COPRO-A').click();
    cy.get('[data-cy=unit-item]').should('not.contain.text', 'B201');
    cy.screenshot('COP-PO-006-copro-a-selected');

    // Revenir et sélectionner COPRO-B
    cy.visit('/choose-space');
    cy.get('[data-cy=coproperty-option]').contains('COPRO-B').click();
    cy.get('[data-cy=unit-item]').should('contain.text', 'B201');
    cy.screenshot('COP-PO-006-copro-b-selected');
  });
});

describe('COP-PO-007 — Locataire connecté', () => {
  it('COP-PO-007 E — Menus financiers masqués pour ten-1', () => {
    cy.login('tenant1@example.com', 'Tenant1234!');
    cy.visit('/owner-portal');
    cy.get('[data-cy=invoices-menu]').should('not.exist');
    cy.get('[data-cy=treasury-menu]').should('not.exist');
    cy.screenshot('COP-PO-007-tenant-restricted-menus');
  });
});
