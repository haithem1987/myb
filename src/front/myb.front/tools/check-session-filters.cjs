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
  assert.deepEqual(deleted, ['myb-app-v1']);
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

  const { FundCallsListComponent } = load('libs/coproperty-module/src/lib/components/fund-calls-list/fund-calls-list.component.ts');
  const calls = Object.create(FundCallsListComponent.prototype);
  Object.assign(calls, { fundCallsRequestId: 0, selectedCopropertyId: signal('a'), fundCalls: signal([]), loading: signal(false), coproperties: () => [],
    filterOwnerId: () => '', filterYear: () => null, filterStatus: () => '', searchTerm: () => '' });
  const a = new rx.Subject(), b = new rx.Subject();
  calls.fundCallService = { getFundCallsByCoproperty: id => id === 'a' ? a : b };
  calls.loadAllFundCalls();
  calls.selectedCopropertyId.set('b'); calls.loadAllFundCalls();
  b.next([{ id: 'b-call', copropertyId: 'b', dueDate: '2025-12-31', copropertyName: 'B' }]); b.complete();
  a.next([{ id: 'a-call', copropertyId: 'a' }]); a.complete();
  assert.equal(calls.filteredFundCalls.length, 1);
  assert.equal(calls.filteredFundCalls[0].id, 'b-call');
  assert.equal(calls.loading(), false);
  const { OwnerDashboardComponent } = load('libs/coproperty-module/src/lib/components/owner-portal/owner-dashboard.component.ts');
  const dashboard = new OwnerDashboardComponent();
  dashboard.getCurrentUserId = () => 'owner';
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
  receipts.keycloakService = { getProfile: () => null };
  receipts.ownerService = { getOwnerByUserId: () => rx.of(null), getMyUnits: () => rx.of([]), getMyInvoices: () => rx.of([]) };
  receipts.fundCallService = { getFundCallPaymentsByOwner: () => rx.of([{ id: 'receipt', copropertyId: 'b', date: new Date(), paymentDate: new Date() }]) };
  receipts.mapFundCallPayment = payment => payment;
  receipts.loadReceipts();
  assert.equal(receipts.selectedCopropertyId, 'b');
  assert.equal(receipts.filteredInvoices().length, 1);
  console.log('Passed: auth cache exclusion and migration, account identity isolation, logout race, fund-call switching race and historical calls.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
