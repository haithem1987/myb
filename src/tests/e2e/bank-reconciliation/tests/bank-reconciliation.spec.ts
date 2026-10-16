import { test, expect, Page } from '@playwright/test';
import { mockKeycloak } from '../helpers/auth-mock';
import {
  mockBankStatementsApi,
  COPROPERTY_ID,
  STATEMENT_ID,
  ACTIVE_FUND_CALLS,
} from '../helpers/api-mock';

const PAGE_URL = `http://localhost:4300/coproperty/${COPROPERTY_ID}/syndic/bank-reconciliation`;

async function setupPage(page: Page): Promise<void> {
  await mockKeycloak(page, COPROPERTY_ID);
  await mockBankStatementsApi(page);
}

async function uploadFile(page: Page): Promise<void> {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'releve-octobre-2024.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake pdf content'),
  });
  // Wait for summary cards to appear (upload → import API → summary rendered)
  await page.waitForSelector('.summary-cards', { timeout: 10_000 });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Bank Reconciliation', () => {

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.goto(PAGE_URL);
    // Wait for Angular to bootstrap and Keycloak auth to complete
    await page.waitForSelector('h1', { timeout: 15_000 });
  });

  // ── Page layout ──────────────────────────────────────────────────────────

  test('affiche le titre et la zone d\'upload', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Rapprochement bancaire');
    await expect(page.locator('.upload-card')).toBeVisible();
    await expect(page.locator('.upload-hint')).toContainText('OFX, CSV, PDF');
    await expect(page.locator('label.btn-upload')).toBeVisible();
  });

  test('le tableau et les cartes résumé sont masqués avant l\'import', async ({ page }) => {
    await expect(page.locator('.summary-cards')).not.toBeVisible();
    await expect(page.locator('.table-card')).not.toBeVisible();
  });

  // ── Import ───────────────────────────────────────────────────────────────

  test('affiche les cartes résumé après import', async ({ page }) => {
    await uploadFile(page);

    await expect(page.locator('.summary-card.total .summary-value')).toHaveText('4');
    await expect(page.locator('.summary-card.matched .summary-value')).toHaveText('2');
    await expect(page.locator('.summary-card.suggestion .summary-value')).toHaveText('1');
    await expect(page.locator('.summary-card.unmatched .summary-value')).toHaveText('1');
  });

  test('affiche le tableau de réconciliation après import', async ({ page }) => {
    await uploadFile(page);
    await page.waitForSelector('.reconciliation-table');

    const rows = page.locator('.reconciliation-table tbody tr');
    await expect(rows).toHaveCount(4);
  });

  // ── Statuts ──────────────────────────────────────────────────────────────

  test('affiche le badge Rapproché pour les transactions auto-matchées', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    // First 2 rows are AutoMatched (status 0)
    await expect(rows.nth(0).locator('.badge')).toHaveText('Rapproché');
    await expect(rows.nth(0).locator('.badge')).toHaveClass(/badge-success/);
    await expect(rows.nth(1).locator('.badge')).toHaveText('Rapproché');
  });

  test('affiche le badge Suggestion pour les suggestions manuelles', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    // 3rd row is ManualSuggestion (status 1)
    await expect(rows.nth(2).locator('.badge')).toHaveText('Suggestion');
    await expect(rows.nth(2).locator('.badge')).toHaveClass(/badge-warning/);
  });

  test('affiche le badge Non rapproché pour les transactions sans match', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    // 4th row is Unmatched (status 2)
    await expect(rows.nth(3).locator('.badge')).toHaveText('Non rapproché');
    await expect(rows.nth(3).locator('.badge')).toHaveClass(/badge-danger/);
  });

  // ── Bouton Valider ───────────────────────────────────────────────────────

  test('affiche le bouton Valider sur les lignes manuel/non rapproché', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    // AutoMatched rows: no validate button
    await expect(rows.nth(0).locator('.btn-validate')).not.toBeVisible();
    await expect(rows.nth(1).locator('.btn-validate')).not.toBeVisible();
    // ManualSuggestion + Unmatched: button visible
    await expect(rows.nth(2).locator('.btn-validate')).toBeVisible();
    await expect(rows.nth(3).locator('.btn-validate')).toBeVisible();
  });

  test('le bouton Valider affiche "Valider" sans appel de fonds sélectionné', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    await expect(rows.nth(2).locator('.btn-validate')).toHaveText('Valider');
    await expect(rows.nth(3).locator('.btn-validate')).toHaveText('Valider');
  });

  // ── Dropdown Appel de fonds ──────────────────────────────────────────────

  test('affiche le dropdown appel de fonds sur les lignes non rapprochées positives', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    // Rows with Status 1 or 2 and Amount > 0 show the dropdown
    await expect(rows.nth(2).locator('.fc-select')).toBeVisible();
    await expect(rows.nth(3).locator('.fc-select')).toBeVisible();

    // AutoMatched rows: no dropdown
    await expect(rows.nth(0).locator('.fc-select')).not.toBeVisible();
  });

  test('le dropdown charge les appels de fonds au focus', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    const select = rows.nth(3).locator('.fc-select');

    // Focus the dropdown — triggers loadFundCallsIfNeeded()
    await select.focus();

    // Options should populate: default + 2 fund calls
    await expect(select.locator('option')).toHaveCount(3); // 1 placeholder + 2 fund calls
    await expect(select.locator('option').nth(1)).toContainText('Chaabane Leila');
    await expect(select.locator('option').nth(2)).toContainText('Mansour Karim');
  });

  test('le bouton devient "Valider + Enregistrer" quand un appel de fonds est sélectionné', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    const unmatchedRow = rows.nth(3);
    const select = unmatchedRow.locator('.fc-select');
    const validateBtn = unmatchedRow.locator('.btn-validate');

    // Load and select a fund call
    await select.focus();
    await select.selectOption(ACTIVE_FUND_CALLS[0].Id);

    await expect(validateBtn).toHaveText('Valider + Enregistrer');
  });

  // ── Validation ───────────────────────────────────────────────────────────

  test('valider une suggestion met à jour le statut à Rapproché', async ({ page }) => {
    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    const suggRow = rows.nth(2);
    await suggRow.locator('.btn-validate').click();

    // After validation, status badge updates to Rapproché
    await expect(suggRow.locator('.badge')).toHaveText('Rapproché', { timeout: 5000 });
    await expect(suggRow.locator('.badge')).toHaveClass(/badge-success/);
    // Validate button disappears
    await expect(suggRow.locator('.btn-validate')).not.toBeVisible();
  });

  test('valider avec appel de fonds affiche "Enregistré" et fond vert', async ({ page }) => {
    // Override the validate endpoint for this test to return FundCallPaymentId
    await page.route(`**/api/bank-statements/${STATEMENT_ID}/reconciliation/rec-0004/validate`, route => {
      route.fulfill({
        json: {
          Id: 'rec-0004',
          Status: 0,
          IsManuallyValidated: true,
          FundCallId: ACTIVE_FUND_CALLS[0].Id,
          FundCallPaymentId: 'fcp-fc-aaaa-1111',
          MatchedPayment: null,
          Note: null,
        },
      });
    });

    await uploadFile(page);

    const rows = page.locator('.reconciliation-table tbody tr');
    const unmatchedRow = rows.nth(3);

    // Load and select a fund call
    const select = unmatchedRow.locator('.fc-select');
    await select.focus();
    await select.selectOption(ACTIVE_FUND_CALLS[0].Id);

    // Validate
    await unmatchedRow.locator('.btn-validate').click();

    // Row should show "Enregistré" and green background
    await expect(unmatchedRow.locator('.fc-registered')).toContainText('Enregistré', { timeout: 5000 });
    await expect(unmatchedRow).toHaveClass(/row-registered/);
  });

  // ── Export ───────────────────────────────────────────────────────────────

  test('affiche le lien Exporter CSV après import', async ({ page }) => {
    await uploadFile(page);

    const exportLink = page.locator('.btn-export');
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toContainText('Exporter CSV');
    await expect(exportLink).toHaveAttribute('href', `/api/bank-statements/${STATEMENT_ID}/export`);
  });

  // ── Drag & drop ──────────────────────────────────────────────────────────

  test('la zone d\'upload réagit au drag-over', async ({ page }) => {
    const uploadCard = page.locator('.upload-card');

    await uploadCard.dispatchEvent('dragover');
    await expect(uploadCard).toHaveClass(/drag-over/);

    await uploadCard.dispatchEvent('dragleave');
    await expect(uploadCard).not.toHaveClass(/drag-over/);
  });

  // ── Montants ─────────────────────────────────────────────────────────────

  test('affiche les montants en dinars tunisiens (TND)', async ({ page }) => {
    await uploadFile(page);

    const firstAmountCell = page.locator('.reconciliation-table tbody tr').nth(0).locator('.amount');
    // Should contain TND currency formatting
    await expect(firstAmountCell).toContainText('TND');
  });
});
