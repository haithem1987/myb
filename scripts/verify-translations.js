#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const frPath = path.join('/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/admin/src/assets/i18n/fr.json');
const enPath = path.join('/Volumes/NidhalSSD/Projects/myb/src/front/myb.front/apps/admin/src/assets/i18n/en.json');

try {
  const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  function getValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  const keysToCheck = [
    'coproperty.form.newCoproperty',
    'coproperty.form.editCoproperty',
    'coproperty.form.requiredFields',
    'coproperty.form.basicInfo',
    'coproperty.units.title',
    'coproperty.charges.title',
    'coproperty.maintenance.title',
    'common.cancel',
    'common.save',
    'validation.SAVING'
  ];

  console.log('\n=== MISSING TRANSLATION KEYS ===\n');

  let missing = [];
  keysToCheck.forEach(key => {
    const frVal = getValue(fr, key);
    const enVal = getValue(en, key);
    
    if (!frVal || !enVal) {
      missing.push(`❌ ${key}: FR=${frVal ? '✓' : '✗'}, EN=${enVal ? '✓' : '✗'}`);
    } else {
      console.log(`✅ ${key}`);
    }
  });

  if (missing.length > 0) {
    console.log('\n' + missing.join('\n'));
    process.exit(1);
  }

  console.log('\n✅ ALL KEYS PRESENT!\n');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
