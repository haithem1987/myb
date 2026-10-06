const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const rx = require('rxjs');
const root = path.resolve(__dirname, '..');
const signal = initial => { let value = initial; const s = () => value; s.set = v => value = v; return s; };
function load(file) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true }
  }).outputText;
  vm.runInNewContext(output, { exports, require: () => ({ ...rx,
    forkJoin: sources => rx.forkJoin(Object.fromEntries(Object.entries(sources))),
    Component: () => klass => klass, Injectable: () => klass => klass, Inject: () => () => {},
    takeUntilDestroyed: () => source => source, signal, computed: fn => fn, inject: () => ({}),
  }), Date, Number, String, Math, Map, Set, console: { error() {} } });
  return exports;
}
async function main() {
  const tenantTemplate = fs.readFileSync(path.join(root, 'libs/coproperty-module/src/lib/components/tenant-management/tenant-management.component.html'), 'utf8');
  assert.doesNotMatch(
    tenantTemplate,
    /<select[^>]*(?:coproperty|Coproperty)|for="coproperty"/,
    'The tenant screen must use the active coproperty context instead of another selector'
  );
  const fundCallServiceSource = fs.readFileSync(path.join(root, 'libs/coproperty-module/src/lib/services/fund-call.service.ts'), 'utf8');
  assert.match(
    fundCallServiceSource,
    /getFundCallsByCoproperty[\s\S]*?fetchPolicy:\s*'no-cache'/,
    'Fund-call list queries must bypass the typename-free Apollo cache'
  );
  const syndicLayoutSource = fs.readFileSync(path.join(root, 'libs/coproperty-module/src/lib/components/syndic-layout/syndic-layout.component.ts'), 'utf8');
  assert.doesNotMatch(
    syndicLayoutSource,
    /getSyndicMenuCounts|getAllCharges|getAllUnitsBySyndic/,
    'Syndic menu badges must not use cross-coproperty aggregate calls'
  );
  for (const scopedCall of [
    'getChargesByCoproperty',
    'getUnitsByCoproperty',
    'getAllOwners',
    'getTenants',
    'getFundCallsByCoproperty',
    'getCopropertyChargeDistributions',
    'getInterventionsByCoproperty',
    'getSignalements',
  ]) {
    assert.match(
      syndicLayoutSource,
      new RegExp(`${scopedCall}\\(selectedId\\)`),
      `Syndic menu badge must use the active coproperty for ${scopedCall}`
    );
  }
  assert.match(
    syndicLayoutSource,
    /new Set\(items\.map\(item => item\.chargeId\)\)\.size/,
    'Charge-payment badge must match the page distinct-charge aggregation'
  );
  assert.doesNotMatch(
    syndicLayoutSource,
    /onNavItemClick\(\)[\s\S]{0,200}loadStatistics\(/,
    'Menu navigation must not clear and reload the active coproperty context'
  );

  const events = {};
  const deleted = [];
  vm.runInNewContext(fs.readFileSync(path.join(root, 'apps/client/src/service-worker.js'), 'utf8'), {
    URL, self: { location: { origin: 'https://myb-platform.com' },
      addEventListener: (name, handler) => events[name] = handler, clients: { claim() {} } },
    caches: { keys: async () => ['myb-app-v1', 'myb-app-v2', 'unrelated'], delete: async key => deleted.push(key),
      match: async () => ({ cached: true }) },
  });
  let activation;
  events.activate({ waitUntil: promise => activation = promise });
  await activation;
  assert.deepEqual(deleted, ['myb-app-v1', 'myb-app-v2']);
  for (const pathname of ['/auth/realms/MYB/account', '/auth/realms/MYB/protocol/openid-connect/userinfo', '/api/coproperty/graphql', '/profile', '/admin/']) {
    events.fetch({ request: { method: 'GET', url: 'https://myb-platform.com' + pathname, mode: 'cors', headers: { has: () => false } },
      respondWith() { assert.fail('Must not cache ' + pathname); } });
  }
  let cached = false;
  events.fetch({ request: { method: 'GET', url: 'https://myb-platform.com/assets/icons/icon-192.png', mode: 'cors', headers: { has: () => false } }, respondWith() { cached = true; } });
  assert.equal(cached, true);

  const { KeycloakService } = load('libs/auth/src/lib/keycloak.service.ts');
  const auth = new KeycloakService({}, {});
  auth.keycloak = { authenticated: true, tokenParsed: { sub: 'new-user', email: 'new@example.test' }, loadUserProfile: async () => ({ id: 'old-user', email: 'old@example.test' }) };
  await auth.loadUserProfile();
  assert.equal(auth.getProfile().email, 'new@example.test');
  assert.equal(auth.getUserId(), 'new-user');
  let complete;
  auth.keycloak.loadUserProfile = () => new Promise(resolve => complete = resolve);
  const loading = auth.loadUserProfile();
  auth.keycloak.authenticated = false;
  auth.profileSubject.next(null);
  complete({ id: 'new-user', email: 'new@example.test' });
  await loading;
  assert.equal(auth.getProfile(), null);
  assert.equal(auth.getUserId(), null);

  const { LanguageSwitcherComponent } = load('libs/shared/shared-ui/src/lib/components/language-switcher/language-switcher.component.ts');
  const languageChanges = [];
  const serverLanguageChanges = [];
  const languageSwitcher = new LanguageSwitcherComponent(
    { setLanguage: language => languageChanges.push(language), language$: rx.of('fr') },
    { syncPreferredLanguage: language => { serverLanguageChanges.push(language); return Promise.resolve(); } }
  );
  languageSwitcher.switchLanguage('en');
  await Promise.resolve();
  assert.deepEqual(languageChanges, ['en']);
  assert.deepEqual(serverLanguageChanges, ['en']);

  const { FundCallsListComponent } = load('libs/coproperty-module/src/lib/components/fund-calls-list/fund-calls-list.component.ts');
  const calls = Object.create(FundCallsListComponent.prototype);
  Object.assign(calls, { selectedCopropertyId: signal('a'), fundCalls: signal([]), owners: signal([
    { id: '938492a36e7449c8a698e4015bbf3e01', firstName: 'Query', lastName: 'Owner' }
  ]), loading: signal(false), coproperties: () => [], destroyRef: {},
    filterOwnerId: () => '', filterYear: () => null, filterStatus: () => '', searchTerm: () => '', toastService: { show: () => {} } });
  const a = new rx.Subject(), b = new rx.Subject();
  let bRequests = 0;
  calls.fundCallService = {
    getFundCallsByCoproperty: id => id === 'a' ? a : (++bRequests === 1 ? b : rx.NEVER)
  };
  // Requests remain subscribed so Apollo can deliver their payload, but only the
  // latest selected coproperty is allowed to update component state.
  calls.loadAllFundCalls();
  calls.selectedCopropertyId.set('b'); calls.loadAllFundCalls();
  // A duplicate refresh starts but never emits (Apollo may deduplicate it).
  // The first successful request for the same selected coproperty must still win.
  calls.loadAllFundCalls();
  b.next([{ id: 'b-call', copropertyId: 'b', ownerId: '938492a3-6e74-49c8-a698-e4015bbf3e01', ownerName: 'Query Owner', dueDate: '2025-12-31', copropertyName: 'B' }]); b.complete();
  a.next([{ id: 'a-call', copropertyId: 'a' }]); a.complete();
  assert.equal(calls.filteredFundCalls.length, 1);
  assert.equal(calls.filteredFundCalls[0].id, 'b-call');
  assert.equal(calls.loading(), false);
  assert.deepEqual(Array.from(calls.uniqueOwnersForFilter, owner => owner.id), ['938492a36e7449c8a698e4015bbf3e01']);
  calls.filterOwnerId = () => '938492a36e7449c8a698e4015bbf3e01';
  assert.equal(calls.filteredFundCalls.length, 1);
  const { OwnerDashboardComponent } = load('libs/coproperty-module/src/lib/components/owner-portal/owner-dashboard.component.ts');
  const dashboard = new OwnerDashboardComponent();
  dashboard.getCurrentUserId = () => 'owner';
  dashboard.activeCoproperty = {
    selectAvailable: (coproperties, requested) => requested || coproperties[0]?.id || '',
    setActive: () => {}
  };
  dashboard.currencyService = { current: 'EUR', formatAmount: (amount, currency = 'EUR') => `${amount} ${currency}` };
  dashboard.ownerService = { getOwnerByUserId: () => rx.of({ id: 'owner' }), getMyUnits: () => rx.of([
    { id: 'a-unit', copropertyId: 'a', area: 10, shares: 2 }, { id: 'b-unit', copropertyId: 'b', area: 30, shares: 4 }
  ]) };
  dashboard.copropertyService = { getCoproperties: () => rx.of([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]) };
  dashboard.fundCallService = {
    getFundCallsByOwner: () => rx.of([
      { id: 'a-call', copropertyId: 'a', amount: 100, currency: 'EUR', status: 'TO_PAY', dueDate: '2020-01-01', payments: [] },
      { id: 'b-call', copropertyId: 'b', amount: 200, currency: 'EUR', status: 'TO_PAY', dueDate: '2020-01-01', payments: [] }
    ]),
    getFundCallPaymentsByOwner: () => rx.of([
      { id: 'a-receipt', amount: 10, validationStatus: 'APPROVED', paymentDate: '2026-01-01', fundCall: { coproperty: { id: 'a' }, currency: 'EUR' } },
      { id: 'b-receipt', amount: 20, validationStatus: 'APPROVED', paymentDate: '2026-01-01', fundCall: { coproperty: { id: 'b' }, currency: 'EUR' } }
    ])
  };
  dashboard.loadOwnerData();
  assert.equal(dashboard.selectedCopropertyId(), 'a');
  assert.equal(dashboard.totalDue(), 100);
  dashboard.onCopropertyChange('b');
  assert.equal(dashboard.myUnits()[0].id, 'b-unit');
  assert.equal(dashboard.totalShares(), 4);
  assert.equal(dashboard.totalSurface(), 30);
  assert.equal(dashboard.totalDue(), 200);
  assert.equal(dashboard.totalPaid(), 20);
  assert.equal(dashboard.recentInvoices()[0].id, 'b-receipt');
  assert.equal(dashboard.pendingInvoices()[0].id, 'b-call');
  assert.equal(dashboard.overdueCount(), 1);

  const { OwnerInvoicesComponent } = load('libs/coproperty-module/src/lib/components/owner-portal/invoices/invoices.component.ts');
  const receipts = new OwnerInvoicesComponent();
  receipts.getCurrentUserId = () => 'owner';
  receipts.activeCoproperty = {
    selectAvailable: (coproperties, requested) => requested || coproperties[0]?.id || '',
    setActive: () => {}
  };
  receipts.keycloakService = { getProfile: () => null };
  receipts.copropertyService = { getCoproperties: () => rx.of([{ id: 'b', name: 'B' }]) };
  receipts.ownerService = { getOwnerByUserId: () => rx.of(null), getMyUnits: () => rx.of([]), getMyInvoices: () => rx.of([]) };
  receipts.fundCallService = { getFundCallPaymentsByOwner: () => rx.of([{ id: 'receipt', copropertyId: 'b', date: new Date(), paymentDate: new Date() }]) };
  receipts.mapFundCallPayment = payment => payment;
  receipts.loadReceipts();
  assert.equal(receipts.selectedCopropertyId, 'b');
  assert.equal(receipts.filteredInvoices().length, 1);
  console.log('Passed: active-coproperty badge scoping, auth cache exclusion and migration, account identity isolation, logout race, fund-call switching race and historical calls.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
