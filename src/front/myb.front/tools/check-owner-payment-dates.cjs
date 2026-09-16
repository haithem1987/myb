const ts = require('typescript');
const path = require('node:path');
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..') + path.sep;
function load(file) {
 const output = ts.transpileModule(fs.readFileSync(root + file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
 const exports = {};
 vm.runInNewContext(output, { exports, require: () => ({ Component: () => klass => klass }), Date, Number, String, Math });
 return exports;
}
for (const file of ['libs/coproperty-module/src/lib/components/owner-portal/charges/charges.component.ts','apps/admin/src/app/coproperty/owner/charges/charges.component.ts']) {
 const {OwnerChargesComponent} = load(file);
 const c = Object.create(OwnerChargesComponent.prototype);
 const fc = {amount:50,payments:[{amount:30,validationStatus:'Pending'},{amount:10,validationStatus:'Pending'}]};
 c.fundCalls=()=>[fc];
 assert.equal(c.getFundCallPaidAmount(fc),0);
 assert.equal(c.getFundCallRemainingAmount(fc),50);
 if (typeof c.getFundCallPayableAmount === 'function') {
  assert.equal(c.getFundCallPendingAmount(fc),40);
  assert.equal(c.getFundCallPayableAmount(fc),10);
 }
 assert.equal(c.totalPaid,0);
 fc.payments[0].validationStatus='Approved';
 assert.equal(c.getFundCallPaidAmount(fc),30);
 assert.equal(c.getFundCallRemainingAmount(fc),20);
 if (typeof c.getFundCallPayableAmount === 'function') assert.equal(c.getFundCallPayableAmount(fc),10);
 assert.equal(c.totalPaid,30);
 fc.payments[1].validationStatus='Rejected';
 assert.equal(c.getFundCallRemainingAmount(fc),20);
 if (typeof c.getFundCallPayableAmount === 'function') assert.equal(c.getFundCallPayableAmount(fc),20);
}
const {dateRangeValidator}=load('libs/coproperty-module/src/lib/utils/date-range.validator.ts');
for (const [end,valid] of [['2026-09-06',false],['2026-09-07',false],['2026-09-08',true],['',true]]) {
 const values={startDate:'2026-09-07',endDate:end};
 assert.equal(dateRangeValidator()({get:key=>({value:values[key]})})===null,valid);
}
console.log('Passed: both owner payment views and earlier/equal/later/optional end-date cases.');
