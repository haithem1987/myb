#!/usr/bin/env python3
"""Setup Keycloak: create myb-backend service account client and test syndic user"""
import urllib.request, urllib.parse, json, sys

BASE = "http://localhost:8080"

def get_admin_token():
    data = urllib.parse.urlencode({
        'grant_type': 'password',
        'client_id': 'admin-cli',
        'username': 'admin',
        'password': 'admin'
    }).encode()
    req = urllib.request.Request(f"{BASE}/realms/master/protocol/openid-connect/token", data=data)
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp['access_token']

def api(token, method, path, body=None):
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        r = urllib.request.urlopen(req)
        raw = r.read()
        return json.loads(raw) if raw else None, r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

token = get_admin_token()
print(f"Admin token obtained ({len(token)} chars)")

# ── 1. Create/find myb-backend service account client ────────────────────────
existing, _ = api(token, 'GET', '/admin/realms/MYB/clients?clientId=myb-backend')
if existing:
    client_uuid = existing[0]['id']
    print(f"myb-backend already exists: {client_uuid}")
    svc_enabled = existing[0].get('serviceAccountsEnabled', False)
    if not svc_enabled:
        # Patch to enable service accounts
        api(token, 'PUT', f'/admin/realms/MYB/clients/{client_uuid}', {
            **existing[0],
            'serviceAccountsEnabled': True,
            'publicClient': False
        })
        print("  → Service accounts enabled on existing client")
else:
    _, status = api(token, 'POST', '/admin/realms/MYB/clients', {
        "clientId": "myb-backend",
        "name": "MYB Backend Service",
        "enabled": True,
        "publicClient": False,
        "serviceAccountsEnabled": True,
        "standardFlowEnabled": False,
        "implicitFlowEnabled": False,
        "directAccessGrantsEnabled": False,
        "protocol": "openid-connect"
    })
    print(f"myb-backend client created (HTTP {status})")
    existing, _ = api(token, 'GET', '/admin/realms/MYB/clients?clientId=myb-backend')
    client_uuid = existing[0]['id']

# Get client secret
secret_data, _ = api(token, 'GET', f'/admin/realms/MYB/clients/{client_uuid}/client-secret')
client_secret = secret_data.get('value', '')
print(f"Client secret: {client_secret}")

# ── 2. Grant admin realm-management roles to service account ─────────────────
# The service account needs view-users + query-users + manage-realm roles
sa_resp, _ = api(token, 'GET', f'/admin/realms/MYB/clients/{client_uuid}/service-account-user')
sa_user_id = sa_resp['id']
print(f"Service account user ID: {sa_user_id}")

# Get realm-management client UUID
rm_resp, _ = api(token, 'GET', '/admin/realms/MYB/clients?clientId=realm-management')
rm_uuid = rm_resp[0]['id']

# Get needed roles from realm-management
needed_roles = ['view-users', 'query-users', 'manage-realm', 'create-client', 'manage-clients']
rm_roles, _ = api(token, 'GET', f'/admin/realms/MYB/clients/{rm_uuid}/roles')
roles_to_assign = [r for r in rm_roles if r['name'] in needed_roles]
print(f"Assigning {len(roles_to_assign)} realm-management roles to service account")
api(token, 'POST', f'/admin/realms/MYB/users/{sa_user_id}/role-mappings/clients/{rm_uuid}', roles_to_assign)
print("  → Realm-management roles assigned")

# ── 3. Ensure coproperty-syndic realm role exists ─────────────────────────────
role_check, status = api(token, 'GET', '/admin/realms/MYB/roles/coproperty-syndic')
if status == 404:
    api(token, 'POST', '/admin/realms/MYB/roles', {
        "name": "coproperty-syndic",
        "description": "Coproperty manager / syndic role"
    })
    print("coproperty-syndic role created")
else:
    print(f"coproperty-syndic role already exists: {role_check['id']}")

# ── 4. Create test syndic user and assign role ────────────────────────────────
users, _ = api(token, 'GET', '/admin/realms/MYB/users?username=syndic.test')
if users:
    syndic_id = users[0]['id']
    print(f"Test syndic user already exists: {syndic_id}")
else:
    _, status = api(token, 'POST', '/admin/realms/MYB/users', {
        "username": "syndic.test",
        "firstName": "Sophie",
        "lastName": "Syndic",
        "email": "syndic.test@myb.local",
        "enabled": True,
        "credentials": [{"type": "password", "value": "syndic123", "temporary": False}]
    })
    print(f"Test syndic user created (HTTP {status})")
    users, _ = api(token, 'GET', '/admin/realms/MYB/users?username=syndic.test')
    syndic_id = users[0]['id']

# Assign coproperty-syndic role to this user
role_data, _ = api(token, 'GET', '/admin/realms/MYB/roles/coproperty-syndic')
api(token, 'POST', f'/admin/realms/MYB/users/{syndic_id}/role-mappings/realm', [role_data])
print(f"coproperty-syndic role assigned to syndic.test user")

print()
print("=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Backend client ID   : myb-backend")
print(f"Backend client UUID : {client_uuid}")
print(f"Backend secret      : {client_secret}")
print(f"Test user           : syndic.test / syndic123")
print()
print("Add to docker-compose env for myb-coproperty:")
print(f"  Keycloak__ServiceClientId=myb-backend")
print(f"  Keycloak__ServiceClientSecret={client_secret}")
