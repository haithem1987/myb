#!/usr/bin/env python3
import json
import sys

def get_all_keys(d, prefix=''):
    """Recursively get all keys from nested dict"""
    keys = []
    for k, v in d.items():
        full_key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.extend(get_all_keys(v, full_key))
        else:
            keys.append(full_key)
    return set(keys)

# Read all files
with open('src/front/myb.front/apps/admin/src/assets/i18n/fr.json', 'r', encoding='utf-8') as f:
    admin_fr = json.load(f)
with open('src/front/myb.front/apps/admin/src/assets/i18n/en.json', 'r', encoding='utf-8') as f:
    admin_en = json.load(f)
with open('src/front/myb.front/apps/client/src/assets/i18n/fr.json', 'r', encoding='utf-8') as f:
    client_fr = json.load(f)
with open('src/front/myb.front/apps/client/src/assets/i18n/en.json', 'r', encoding='utf-8') as f:
    client_en = json.load(f)

admin_fr_keys = get_all_keys(admin_fr)
client_fr_keys = get_all_keys(client_fr)
admin_en_keys = get_all_keys(admin_en)
client_en_keys = get_all_keys(client_en)

print("=" * 70)
print("TRANSLATION SYNC STATUS")
print("=" * 70)

print("\n📊 STATISTICS:")
print(f"  Admin FR:  {len(admin_fr_keys)} keys")
print(f"  Client FR: {len(client_fr_keys)} keys")
print(f"  Admin EN:  {len(admin_en_keys)} keys")
print(f"  Client EN: {len(client_en_keys)} keys")

print("\n=== FRENCH (FR) ===")
missing_fr = admin_fr_keys - client_fr_keys
if missing_fr:
    print(f"❌ Missing in client: {len(missing_fr)} keys")
    for key in sorted(missing_fr)[:10]:
        print(f"  - {key}")
    if len(missing_fr) > 10:
        print(f"  ... and {len(missing_fr) - 10} more")
    sys.exit(1)
else:
    print("✅ All French keys synced!")

print("\n=== ENGLISH (EN) ===")
missing_en = admin_en_keys - client_en_keys
if missing_en:
    print(f"❌ Missing in client: {len(missing_en)} keys")
    for key in sorted(missing_en)[:10]:
        print(f"  - {key}")
    if len(missing_en) > 10:
        print(f"  ... and {len(missing_en) - 10} more")
    sys.exit(1)
else:
    print("✅ All English keys synced!")

print("\n" + "=" * 70)
print("✅ ALL TRANSLATIONS IN SYNC!")
print("=" * 70)
