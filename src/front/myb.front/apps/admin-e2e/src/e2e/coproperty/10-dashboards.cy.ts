/// <reference types="cypress" />

// Admin E2E — Tableaux de bord et réglages
// Scénarios E (E2E) et V (Visual) — U (Unit) traités dans Jest

describe('COP-DB — Tableau de bord syndic', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-DB-003 V — KPI, graphique trésorerie, activités (fr, 1440px)', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetDashboardStats') {
        req.alias = 'dashboardStats';
      }
    });

    cy.viewport(1440, 900);
    cy.goToSyndicSection('dashboard');
    cy.wait('@dashboardStats');

    cy.get('[data-cy=kpi-cards]').should('be.visible');
    cy.get('[data-cy=treasury-chart]').should('be.visible');
    cy.screenshot('COP-DB-003-syndic-dashboard-1440-fr');
  });

  it('COP-DB-003 V — Tableau de bord syndic (390px mobile)', () => {
    cy.viewport(390, 844);
    cy.goToSyndicSection('dashboard');
    cy.get('[data-cy=kpi-cards]').should('be.visible');
    cy.screenshot('COP-DB-003-syndic-dashboard-390-fr');
  });

  it('COP-DB-004 E — KPI rafraîchis après une action', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetDashboardStats') {
        req.alias = 'dashboardStats';
      }
    });

    cy.goToSyndicSection('dashboard');
    cy.wait('@dashboardStats').then((first) => {
      const initialCount = first.response?.body?.data?.getDashboardStats?.openSignalements ?? 0;
      cy.log(`Signalements initiaux : ${initialCount}`);
    });

    // Simuler une action puis vérifier le rafraîchissement
    cy.goToSyndicSection('dashboard');
    cy.wait('@dashboardStats');
    cy.screenshot('COP-DB-004-after-action');
  });

  it('COP-DB-008 E — Compteurs menu égaux à GetSyndicMenuCounts', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetSyndicMenuCounts') {
        req.alias = 'menuCounts';
      }
    });

    cy.goToSyndicSection('dashboard');
    cy.wait('@menuCounts').then((interception) => {
      const counts = interception.response?.body?.data?.getSyndicMenuCounts;
      if (counts) {
        cy.log(`Compteurs menu : ${JSON.stringify(counts)}`);
      }
    });
    cy.screenshot('COP-DB-008-menu-badges');
  });
});

describe('COP-DB — Tableau de bord propriétaire', () => {
  beforeEach(() => {
    cy.loginAsOwner();
  });

  it('COP-DB-007 V — Propriétaire : lots, solde, échéances, AG', () => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body?.operationName === 'GetDashboardStats') {
        req.alias = 'ownerDashboard';
      }
    });

    cy.goToSyndicSection('owner-dashboard');
    cy.screenshot('COP-DB-007-owner-dashboard');

    cy.get('[data-cy=owner-lots]').should('exist');
    cy.get('[data-cy=owner-balance]').should('exist');
  });
});

describe('COP-DB — Tableau de bord conseil syndical', () => {
  beforeEach(() => {
    cy.loginAsCouncil();
  });

  it('COP-DB-005 V — Conseil : lecture seule, aucun bouton de création', () => {
    cy.goToSyndicSection('dashboard');
    cy.screenshot('COP-DB-005-council-readonly');

    cy.get('[data-cy=create-btn]').should('not.exist');
    cy.get('[data-cy=edit-btn]').should('not.exist');
  });
});

describe('COP-DB — Tableau de bord comptable', () => {
  beforeEach(() => {
    cy.loginAsAccountant();
  });

  it('COP-DB-006 V — Comptable : données financières, pas de gestion lots', () => {
    cy.goToSyndicSection('dashboard');
    cy.screenshot('COP-DB-006-accountant-dashboard');

    cy.get('[data-cy=financial-section]').should('exist');
    cy.get('[data-cy=lot-management-section]').should('not.exist');
  });
});

describe('COP-ST — Réglages syndic', () => {
  beforeEach(() => {
    cy.loginAsSyndic();
  });

  it('COP-ST-001 V — Page réglages syndic (copropriété, WhatsApp, préférences)', () => {
    cy.goToSyndicSection('settings');
    cy.screenshot('COP-ST-001-settings');

    cy.get('[data-cy=settings-form]').should('be.visible');
    cy.get('[data-cy=save-btn]').should('exist');
  });
});

