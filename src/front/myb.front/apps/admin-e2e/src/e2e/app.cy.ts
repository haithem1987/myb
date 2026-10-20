describe('admin-e2e smoke', () => {
  it('should load the app after login', () => {
    cy.loginAsSyndic();
    cy.visit('/coproperty/select');
    cy.url({ timeout: 15000 }).should('include', 'coproperty');
  });
});
