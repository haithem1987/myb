const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const file = path.join(__dirname, '../libs/coproperty-module/src/lib/components/owner-portal/invoices/invoices.component.ts');
const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } }).outputText;
const signal = initial => { let value = initial; const s = () => value; s.set = v => value = v; return s; };
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject, require: () => ({
  Component: () => klass => klass, signal, computed: fn => fn,
  inject: () => ({ current: 'TND', formatAmount: (amount, currency = 'TND') => `${amount} ${currency}` })
}), Date, Number, String, Math, Map });
const component = new exportsObject.OwnerInvoicesComponent();
const receipt = (id, copropertyId, currency, amount, status, year = 2026) => ({ id, copropertyId, currency, amount, status, date: new Date(year, 8, 11), paymentDate: new Date(year, 8, 11) });
component.selectedYear = '2026';
component.invoices.set([
 receipt('e', 'paris', 'EUR', 2000, 'paid'), receipt('t', 'tunis', 'TND', 200, 'pending'),
 receipt('t2', 'tunis', 'TND', 100, 'paid'), receipt('r', 'tunis', 'TND', 90, 'rejected'),
 receipt('old', 'paris', 'EUR', 300, 'paid', 2025)
]);
component.filterInvoices();
assert.equal(component.filteredInvoices().length, 0);
assert.equal(component.totalPaidDisplay(), '—');
component.selectedCopropertyId = 'paris'; component.filterInvoices();
assert.equal(component.filteredInvoices().length, 1);
assert.equal(component.totalPaidDisplay(), '2000 EUR');
component.selectedCopropertyId = 'tunis'; component.filterInvoices();
assert.equal(component.filteredInvoices().length, 3);
assert.equal(component.totalPaidDisplay(), '100 TND');
component.selectedCopropertyId = 'paris'; component.selectedYear = '2025'; component.filterInvoices();
assert.equal(component.totalPaidDisplay(), '300 EUR');
console.log('Passed: coproperty/year isolation, mandatory selection, approved-only currency totals.');
