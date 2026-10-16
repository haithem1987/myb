import { Page } from '@playwright/test';

export const STATEMENT_ID = 'stmt-11111111-0000-0000-0000-000000000000';
export const COPROPERTY_ID = 'aaaaaaaa-1111-2222-3333-444444444444';

export const IMPORT_SUMMARY = {
  StatementId: STATEMENT_ID,
  FileName: 'releve-octobre-2024.pdf',
  TransactionCount: 4,
  AutoMatched: 2,
  ManualSuggestions: 1,
  Unmatched: 1,
};

export const RECONCILIATION_DETAIL = {
  Id: STATEMENT_ID,
  FileName: 'releve-octobre-2024.pdf',
  Items: [
    {
      Transaction: {
        Id: 'tx-0001',
        Date: '2024-10-05T00:00:00Z',
        Amount: 320.0,
        Label: 'VIR BEN ALI AHMED - APT001',
        Reference: 'REF-001',
      },
      Reconciliation: {
        Id: 'rec-0001',
        Status: 0, // AutoMatched
        Note: null,
        IsManuallyValidated: false,
        MatchedPayment: { Id: 'pay-001', Amount: 320.0, PaymentDate: '2024-10-05T00:00:00Z', Description: 'Charge mensuelle' },
        FundCallId: null,
        FundCallPaymentId: null,
      },
    },
    {
      Transaction: {
        Id: 'tx-0002',
        Date: '2024-10-10T00:00:00Z',
        Amount: 450.0,
        Label: 'VIR TRABELSI SONIA - APT003',
        Reference: 'REF-002',
      },
      Reconciliation: {
        Id: 'rec-0002',
        Status: 0, // AutoMatched
        Note: null,
        IsManuallyValidated: false,
        MatchedPayment: { Id: 'pay-002', Amount: 450.0, PaymentDate: '2024-10-10T00:00:00Z', Description: 'Charge mensuelle' },
        FundCallId: null,
        FundCallPaymentId: null,
      },
    },
    {
      Transaction: {
        Id: 'tx-0003',
        Date: '2024-10-12T00:00:00Z',
        Amount: 280.0,
        Label: 'VIR MANSOUR KARIM - APT005',
        Reference: null,
      },
      Reconciliation: {
        Id: 'rec-0003',
        Status: 1, // ManualSuggestion
        Note: 'Montant approchant',
        IsManuallyValidated: false,
        MatchedPayment: { Id: 'pay-003', Amount: 275.0, PaymentDate: '2024-10-12T00:00:00Z', Description: 'Charge mensuelle' },
        FundCallId: null,
        FundCallPaymentId: null,
      },
    },
    {
      Transaction: {
        Id: 'tx-0004',
        Date: '2024-10-15T00:00:00Z',
        Amount: 500.0,
        Label: 'VIR CHAABANE LEILA - APT007',
        Reference: 'REF-004',
      },
      Reconciliation: {
        Id: 'rec-0004',
        Status: 2, // Unmatched
        Note: null,
        IsManuallyValidated: false,
        MatchedPayment: null,
        FundCallId: null,
        FundCallPaymentId: null,
      },
    },
  ],
};

export const ACTIVE_FUND_CALLS = [
  {
    Id: 'fc-aaaa-1111',
    Description: 'Appel de fonds Q4 2024',
    Amount: 500.0,
    DueDate: '2024-10-31T00:00:00Z',
    Status: 'ToPay',
    OwnerName: 'Chaabane Leila',
    CopropertyNameSnapshot: 'Résidence Les Jardins',
  },
  {
    Id: 'fc-bbbb-2222',
    Description: 'Appel de fonds Q4 2024',
    Amount: 280.0,
    DueDate: '2024-10-31T00:00:00Z',
    Status: 'PendingValidation',
    OwnerName: 'Mansour Karim',
    CopropertyNameSnapshot: 'Résidence Les Jardins',
  },
];

export async function mockBankStatementsApi(page: Page): Promise<void> {
  // Import
  await page.route('**/api/bank-statements/import', route => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: IMPORT_SUMMARY });
    } else {
      route.continue();
    }
  });

  // Reconciliation detail
  await page.route(`**/api/bank-statements/${STATEMENT_ID}/reconciliation`, route =>
    route.fulfill({ json: RECONCILIATION_DETAIL })
  );

  // Active fund calls
  await page.route(`**/api/bank-statements/fund-calls/active**`, route =>
    route.fulfill({ json: ACTIVE_FUND_CALLS })
  );

  // Validate — by default returns the reconciliation as validated
  await page.route(`**/api/bank-statements/${STATEMENT_ID}/reconciliation/*/validate`, route => {
    const url = route.request().url();
    const recId = url.split('/reconciliation/')[1].split('/validate')[0];
    const body = route.request().postDataJSON() as { FundCallId?: string };
    const fundCallPaymentId = body?.FundCallId ? `fcp-${body.FundCallId.slice(3, 11)}` : null;

    const item = RECONCILIATION_DETAIL.Items.find(i => i.Reconciliation.Id === recId);
    route.fulfill({
      json: {
        ...(item?.Reconciliation ?? {}),
        Id: recId,
        Status: 0,
        IsManuallyValidated: true,
        FundCallId: body?.FundCallId ?? null,
        FundCallPaymentId: fundCallPaymentId,
      },
    });
  });
}
