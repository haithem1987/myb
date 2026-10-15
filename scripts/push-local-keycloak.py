#!/usr/bin/env python3
"""Idempotent Keycloak setup for local Web Push testing (used by scripts/push-local.sh).

Creates, if missing: realm MYB, public client MYB-client (localhost:4200/4201), the coproperty
client roles, the myb-backend service-account client with the secret docker-compose expects,
and two test accounts. The realm logs in with e-mail, so accounts are looked up by e-mail.

    python scripts/push-local-keycloak.py setup
    python scripts/push-local-keycloak.py user-id owner@myb-test.com
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

KC_URL = os.environ.get("KC_URL", "http://localhost:8080")
REALM = "MYB"
FRONT_CLIENT = "MYB-client"
SERVICE_CLIENT = os.environ.get("KEYCLOAK_SERVICE_CLIENT_ID", "myb-backend")
SERVICE_SECRET = os.environ.get("KEYCLOAK_SERVICE_CLIENT_SECRET", "Iae91CtN9N1a3voLVYW4yFsaA7woSTDD")
CLIENT_ROLES = ["coproperty-syndic", "coproperty-owner", "coproperty-council",
                "coproperty-accountant", "coproperty-admin", "system-admin"]
SERVICE_ACCOUNT_ROLES = ["view-users", "query-users", "manage-users", "manage-realm",
                         "create-client", "manage-clients"]
TEST_USERS = [
    # e-mail, password, first name, last name, client role, realm roles
    ("owner@myb-test.com", "owner123", "Jean", "Martin", "coproperty-owner", []),
    ("syndic@myb-test.com", "syndic123", "Marie", "Dubois", "coproperty-syndic", ["coproperty-syndic"]),
]


def admin_token():
    data = urllib.parse.urlencode({
        "grant_type": "password", "client_id": "admin-cli",
        "username": os.environ.get("KEYCLOAK_ADMIN_USER", "admin"),
        "password": os.environ.get("KEYCLOAK_ADMIN_PASSWORD", "admin"),
    }).encode()
    with urllib.request.urlopen(f"{KC_URL}/realms/master/protocol/openid-connect/token", data) as r:
        return json.load(r)["access_token"]


TOKEN = None


def api(method, path, body=None, ok_statuses=(200, 201, 204, 409)):
    req = urllib.request.Request(
        f"{KC_URL}/admin/realms{path}", method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        if e.code in ok_statuses:
            return None
        if e.code == 404 and method == "GET":
            return None
        raise SystemExit(f"Keycloak {method} {path} failed: HTTP {e.code} {e.read().decode('utf-8', 'replace')}")


def ensure_client(client_id, representation):
    found = api("GET", f"/{REALM}/clients?clientId={urllib.parse.quote(client_id)}")
    if not found:
        api("POST", f"/{REALM}/clients", {"clientId": client_id, **representation})
        found = api("GET", f"/{REALM}/clients?clientId={urllib.parse.quote(client_id)}")
        print(f"  created client {client_id}")
    else:
        api("PUT", f"/{REALM}/clients/{found[0]['id']}", {**found[0], **representation})
    return found[0]["id"]


def find_user(email):
    users = api("GET", f"/{REALM}/users?email={urllib.parse.quote(email)}&exact=true") or []
    return users[0]["id"] if users else None


def setup():
    if api("GET", f"/{REALM}") is None:
        api("POST", "", {
            "realm": REALM, "enabled": True, "registrationAllowed": True,
            "registrationEmailAsUsername": True, "loginWithEmailAllowed": True,
            "duplicateEmailsAllowed": False, "resetPasswordAllowed": True, "verifyEmail": False,
        })
        print(f"  created realm {REALM}")

    front_uuid = ensure_client(FRONT_CLIENT, {
        "enabled": True, "publicClient": True, "standardFlowEnabled": True,
        "directAccessGrantsEnabled": True,
        "redirectUris": ["http://localhost:4200/*", "http://localhost:4201/*"],
        "webOrigins": ["http://localhost:4200", "http://localhost:4201"],
        "attributes": {"post.logout.redirect.uris": "http://localhost:4200/*##http://localhost:4201/*"},
    })
    for role in CLIENT_ROLES:
        if api("GET", f"/{REALM}/clients/{front_uuid}/roles/{role}") is None:
            api("POST", f"/{REALM}/clients/{front_uuid}/roles", {"name": role})
    if api("GET", f"/{REALM}/roles/coproperty-syndic") is None:
        api("POST", f"/{REALM}/roles", {"name": "coproperty-syndic"})

    service_uuid = ensure_client(SERVICE_CLIENT, {
        "enabled": True, "publicClient": False, "serviceAccountsEnabled": True,
        "standardFlowEnabled": False, "directAccessGrantsEnabled": False,
        "clientAuthenticatorType": "client-secret", "secret": SERVICE_SECRET,
    })
    service_user = api("GET", f"/{REALM}/clients/{service_uuid}/service-account-user")
    realm_management = api("GET", f"/{REALM}/clients?clientId=realm-management")[0]["id"]
    roles = [r for r in api("GET", f"/{REALM}/clients/{realm_management}/roles?max=200")
             if r["name"] in SERVICE_ACCOUNT_ROLES]
    api("POST", f"/{REALM}/users/{service_user['id']}/role-mappings/clients/{realm_management}", roles)
    print(f"  {SERVICE_CLIENT}: service account ready, secret aligned with docker-compose")

    for email, password, first, last, client_role, realm_roles in TEST_USERS:
        user_id = find_user(email)
        if user_id is None:
            api("POST", f"/{REALM}/users", {
                "username": email, "email": email, "firstName": first, "lastName": last,
                "enabled": True, "emailVerified": True,
                "credentials": [{"type": "password", "value": password, "temporary": False}],
            })
            user_id = find_user(email)
            print(f"  created user {email}")
        role = api("GET", f"/{REALM}/clients/{front_uuid}/roles/{client_role}")
        api("POST", f"/{REALM}/users/{user_id}/role-mappings/clients/{front_uuid}", [role])
        for realm_role in realm_roles:
            api("POST", f"/{REALM}/users/{user_id}/role-mappings/realm",
                [api("GET", f"/{REALM}/roles/{realm_role}")])
    print("  test accounts: owner@myb-test.com / owner123 | syndic@myb-test.com / syndic123")


if __name__ == "__main__":
    TOKEN = admin_token()
    command = sys.argv[1] if len(sys.argv) > 1 else "setup"
    if command == "setup":
        setup()
    elif command == "user-id":
        user = find_user(sys.argv[2]) if len(sys.argv) > 2 else None
        if not user:
            raise SystemExit(f"Unknown Keycloak user: {sys.argv[2] if len(sys.argv) > 2 else ''}")
        print(user)
    else:
        raise SystemExit(__doc__)
