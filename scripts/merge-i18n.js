#!/usr/bin/env node
/**
 * One-shot i18n merge between apps/admin and apps/client.
 *
 *  - Deep-merges any top-level key present in one app but missing in the other.
 *  - Never overwrites an existing value (silent-drift protection).
 *  - Idempotent: running twice produces no diff.
 *  - Preserves 2-space indentation, trailing newline.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(
  __dirname,
  '../src/front/myb.front'
);

const PAIRS = [
  {
    a: path.join(ROOT, 'apps/admin/src/assets/i18n/fr.json'),
    b: path.join(ROOT, 'apps/client/src/assets/i18n/fr.json'),
  },
  {
    a: path.join(ROOT, 'apps/admin/src/assets/i18n/en.json'),
    b: path.join(ROOT, 'apps/client/src/assets/i18n/en.json'),
  },
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `src` into `dst`. Returns { dst, added } where `added` is the
 * number of leaf keys actually inserted (existing leaves are not counted).
 * Existing values in `dst` are never overwritten.
 */
function mergeInto(dst, src) {
  let added = 0;
  for (const key of Object.keys(src)) {
    if (!(key in dst)) {
      dst[key] = src[key];
      added += countLeaves(src[key]);
      continue;
    }
    if (isPlainObject(dst[key]) && isPlainObject(src[key])) {
      added += mergeInto(dst[key], src[key]);
    }
    // otherwise: dst already has a value, leave it (conflict protection)
  }
  return added;
}

function countLeaves(v) {
  if (isPlainObject(v)) {
    return Object.values(v).reduce((n, x) => n + countLeaves(x), 0);
  }
  return 1;
}

let totalAdded = 0;
for (const { a, b } of PAIRS) {
  const admin = readJson(a);
  const client = readJson(b);
  const intoClient = mergeInto(client, admin);
  const intoAdmin = mergeInto(admin, client);
  writeJson(a, admin);
  writeJson(b, client);
  console.log(
    `${path.relative(ROOT, a)}  +${intoAdmin} keys  <->  ${path.relative(
      ROOT,
      b
    )}  +${intoClient} keys`
  );
  totalAdded += intoAdmin + intoClient;
}
console.log(`Done. ${totalAdded} keys added in total.`);
