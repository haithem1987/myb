#!/usr/bin/env python3
"""Check frontend translation files (fr / en / ar) for the client and admin apps.

Checks per app:
  - key parity between languages (error)
  - empty values (error)
  - interpolation parameters {{ x }} that differ from the French source (error)
  - keys used in templates/code but absent from the files (error)
  - Arabic values without any Arabic letters (warning)
  - English values containing French accents/words (warning)
  - FR == EN values (info, often legitimate: brand names, emails...)

Usage: python scripts/check-translations.py [--verbose]
Exit code 1 when an error is found.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT = os.path.join(ROOT, 'src', 'front', 'myb.front')
APPS = ['client', 'admin']
LANGS = ['fr', 'en', 'ar']
VERBOSE = '--verbose' in sys.argv

PARAM_RE = re.compile(r'\{\{\s*([\w.]+)\s*\}\}')
ARABIC_RE = re.compile(r'[؀-ۿ]')
FRENCH_RE = re.compile(r"[éèêàçùûôî]|\b(le|les|des|votre|vous|avec|pour|une)\b", re.IGNORECASE)
KEY_USE_RE = re.compile(
    r"""['"`]([A-Za-z][\w-]*(?:\.[\w-]+)+)['"`]\s*\|\s*translate"""
    r"""|(?:instant|get|stream)\(\s*['"`]([A-Z][\w-]*(?:\.[\w-]+)+)['"`]"""
)
# Arabic values may keep these untranslated (brand, units, codes).
ARABIC_EXEMPT_RE = re.compile(r'^[\s\W\d]*$|^(MYB|PDF|Email|E-mail|ID|TND|EUR|USD|IBAN|RIB|SMS|OK)\b', re.IGNORECASE)


def flatten(d, prefix=''):
    out = {}
    for k, v in d.items():
        key = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def used_keys():
    keys = {}
    for base in ('apps', 'libs'):
        for dirpath, dirnames, filenames in os.walk(os.path.join(FRONT, base)):
            dirnames[:] = [d for d in dirnames if d not in ('node_modules', 'dist', '.angular', 'assets')]
            for name in filenames:
                if not name.endswith(('.ts', '.html')) or name.endswith('.spec.ts'):
                    continue
                path = os.path.join(dirpath, name)
                with open(path, encoding='utf-8') as f:
                    for m in KEY_USE_RE.finditer(f.read()):
                        keys.setdefault(m.group(1) or m.group(2), os.path.relpath(path, FRONT))
    return keys


def report(title, items, limit=None):
    if not items:
        return
    print(f'  {title}: {len(items)}')
    shown = items if VERBOSE or limit is None else items[:limit]
    for item in shown:
        print(f'    - {item}')
    if len(shown) < len(items):
        print(f'    ... (+{len(items) - len(shown)}, use --verbose)')


def main():
    usage = used_keys()
    errors = 0
    for app in APPS:
        folder = os.path.join(FRONT, 'apps', app, 'src', 'assets', 'i18n')
        data = {}
        for lang in LANGS:
            path = os.path.join(folder, f'{lang}.json')
            if os.path.exists(path):
                with open(path, encoding='utf-8') as f:
                    data[lang] = flatten(json.load(f))
        all_keys = set().union(*(d.keys() for d in data.values()))
        print('=' * 70)
        print(f'{app}: ' + ', '.join(f'{lang}={len(d)}' for lang, d in data.items()))

        for lang, d in data.items():
            missing = sorted(all_keys - d.keys())
            empty = sorted(k for k, v in d.items() if v in ('', None))
            errors += len(missing) + len(empty)
            report(f'ERROR missing in {lang}', missing, 20)
            report(f'ERROR empty in {lang}', empty, 20)

        fr = data.get('fr', {})
        for lang, d in data.items():
            if lang == 'fr':
                continue
            bad = sorted(
                k for k, v in d.items()
                if k in fr and isinstance(v, str) and isinstance(fr[k], str)
                and set(PARAM_RE.findall(v)) != set(PARAM_RE.findall(fr[k]))
            )
            errors += len(bad)
            report(f'ERROR interpolation params differ from fr in {lang}', bad, 20)

        absent = sorted(
            f'{k}  <- {src}' for k, src in usage.items()
            if k not in all_keys and not any(x.startswith(k + '.') for x in all_keys)
        )
        errors += len(absent)
        report('ERROR used in code but absent', absent, 20)

        if 'ar' in data:
            report('WARN ar value without Arabic letters', sorted(
                f'{k} = {v}' for k, v in data['ar'].items()
                if isinstance(v, str) and not ARABIC_RE.search(v) and not ARABIC_EXEMPT_RE.search(v)
            ), 20)
        if 'en' in data:
            report('WARN en value looks French', sorted(
                f'{k} = {v}' for k, v in data['en'].items()
                if isinstance(v, str) and FRENCH_RE.search(v)
            ), 20)
            same = sorted(
                k for k, v in data['en'].items()
                if isinstance(v, str) and fr.get(k) == v and re.search(r'[A-Za-z]{4,}', v)
            )
            print(f'  INFO identical fr/en values: {len(same)}')
            if VERBOSE:
                for k in same:
                    print(f'    - {k} = {fr[k]}')

    print('=' * 70)
    print('OK' if errors == 0 else f'{errors} error(s)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
