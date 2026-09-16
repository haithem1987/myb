import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sharedSourceRoot = 'libs/coproperty-module/src';
const applications = ['client', 'admin'];
const languages = ['en', 'fr'];
const translationPrefixes = ['coproperty.', 'ownerPortal.', 'common.'];
const nonTranslationProperties = new Set(['coproperty.id', 'coproperty.description']);

function sourceFiles(directory, result = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) sourceFiles(path, result);
    else if (/\.(?:html|ts)$/.test(entry.name)) result.push(path);
  }
  return result;
}

function readTranslation(path, key) {
  return key.split('.').reduce((value, segment) => {
    if (!value || !Object.prototype.hasOwnProperty.call(value, segment)) return undefined;
    return value[segment];
  }, JSON.parse(readFileSync(path, 'utf8')));
}

const literalPattern = /['"]((?:coproperty|ownerPortal|common)\.[A-Za-z0-9_.-]+)['"]/g;
const referencedKeys = new Set();

for (const path of sourceFiles(sharedSourceRoot)) {
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(literalPattern)) {
    const key = match[1];
    if (!key.endsWith('.') && !nonTranslationProperties.has(key)) referencedKeys.add(key);
  }
}

const missing = [];
for (const application of applications) {
  for (const language of languages) {
    const translationPath = `apps/${application}/src/assets/i18n/${language}.json`;
    for (const key of referencedKeys) {
      const value = readTranslation(translationPath, key);
      if (typeof value !== 'string' || value.trim() === '') {
        missing.push(`${application}/${language}: ${key}`);
      }
    }
  }
}

if (missing.length > 0) {
  console.error('Shared translations must exist in client/admin and en/fr:\n');
  console.error(missing.map(item => `  - ${item}`).join('\n'));
  process.exit(1);
}

console.log(`Shared i18n check passed (${referencedKeys.size} keys across client/admin and en/fr).`);
