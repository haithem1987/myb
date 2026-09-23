const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true }
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: () => ({ Component: () => klass => klass }), Date, Number, String, Math, Map });
  return exports;
}
const { FundCallsListComponent } = load('libs/coproperty-module/src/lib/components/fund-calls-list/fund-calls-list.component.ts');
const c = Object.create(FundCallsListComponent.prototype);
const calls = [
  { id: 'one', amount: '1000', currency: 'EUR', payments: [{ id: 'p', amount: '500', validationStatus: 'Pending' }] },
  { id: 'two', amount: 200, currency: 'EUR', payments: [{ amount: 50, validationStatus: 'APPROVED' }, { amount: 75, validationStatus: 'Rejected' }, { amount: 10 }] }
];
Object.defineProperty(c, 'filteredFundCalls', { get: () => calls });
c.coproperties = () => [];
c.selectedCopropertyId = () => null;
c.currencyService = { current: 'EUR', formatAmount: (amount, currency = 'EUR') => `${amount} ${currency}` };
assert.equal(c.getTotalAmount(), 1200);
assert.equal(c.getTotalPaidAmount(), 50);
assert.equal(c.getPaidAmountDisplay(), '50 EUR');
assert.equal(c.getTotalRemainingAmount(), 1150);
assert.equal(c.getRemainingAmountDisplay(), '1150 EUR');
assert.equal(c.getTotalPayments(calls[0]), 0);
// A successful review fetch updates the list and consequently every summary.
c.editingFundCall = Object.assign(() => calls[0], { set: () => {} });
c.editForm = { patchValue: () => {} };
c.fundCalls = { update: fn => { const updated = fn(calls); calls.splice(0, calls.length, ...updated); } };
c.fundCallService = { getFundCallById: () => ({ subscribe: observer => observer.next({ ...calls[0], payments: [{ amount: 500, validationStatus: 'Approved' }] }) }) };
c.reloadEditingFundCall();
assert.equal(c.getTotalPaidAmount(), 550);
assert.equal(c.getTotalRemainingAmount(), 650);
assert.equal(c.getPaidAmountDisplay(), '550 EUR');
assert.equal(c.getRemainingAmountDisplay(), '650 EUR');
assert.equal(c.getTotalPayments(calls[0]), 500);
assert.equal(c.getTotalPaidAmount() / c.getTotalAmount() * 100, 550 / 1200 * 100);
calls.push({ amount: 100, currency: 'TND', payments: [{ amount: 25, validationStatus: 'Approved' }] });
assert.equal(c.getRemainingAmountDisplay(), '650 EUR · 75 TND');
calls.length = 0;
assert.equal(c.getTotalAmount(), 0);
assert.equal(c.getTotalPaidAmount(), 0);
assert.equal(c.getRemainingAmountDisplay(), '0 EUR');

const { translateNotificationMessage: render } = load('libs/shared/infra/utils/notification-message.ts');
for (const app of ['admin', 'client']) {
  let language = 'en';
  const catalogs = Object.fromEntries(['en', 'fr'].map(lang => [lang, JSON.parse(fs.readFileSync(path.join(root, `apps/${app}/src/assets/i18n/${lang}.json`), 'utf8'))]));
  const translate = { instant: (key, params = {}) => {
    const value = key.split('.').reduce((obj, part) => obj?.[part], catalogs[language]);
    assert.ok(value, `Missing ${app}/${language}/${key}`);
    return value.replace(/{{(.*?)}}/g, (_, name) => params[name]);
  } };
  const message = 'Votre paiement de 500 € pour « Budget 2026 » a été validé.';
  assert.equal(render(message, translate), 'Your payment of 500 € for “Budget 2026” was approved.');
  assert.equal(render('Zoé a mis à jour son profil.', translate), 'Zoé updated their profile.');
  assert.equal(render('💰 Paiement reçu : Zoé a versé 500 € (Virement) pour "Budget". Reste à payer : 500 €', translate), '💰 Payment submitted: Zoé submitted 500 € (Bank transfer) for “Budget”. Amount still to submit: 500 €');
  language = 'fr';
  assert.equal(render(message, translate), message);
  assert.equal(render('Zoé verified their email and accessed their MYB account.', translate), 'Zoé a vérifié son adresse e-mail et accédé à son compte MYB.');
  assert.equal(render('Custom message: Budget 2026', translate), 'Custom message: Budget 2026');
  assert.equal(render('Votre paiement de 500 € pour « Budget » a été rejeté. Motif : Document illisible', translate), 'Votre paiement de 500 € pour « Budget » a été rejeté. Motif : Document illisible');
}
console.log('Passed: approved-only fund totals, review refresh, currencies, empty list, and notification language switching in both Nx apps.');
