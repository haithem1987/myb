import { Page } from '@playwright/test';

// Minimal fake JWT — keycloak-js parses claims but doesn't verify signature client-side
function makeFakeJwt(claims: object): string {
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}.fakesignature`;
}

export const USER_PROFILE = {
  id: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
  username: 'test.syndic',
  firstName: 'Test',
  lastName: 'Syndic',
  email: 'test.syndic@myb.test',
  emailVerified: true,
  attributes: {},
};

export const OIDC_CONFIG = {
  issuer: 'http://localhost:8080/realms/MYB',
  authorization_endpoint: 'http://localhost:8080/realms/MYB/protocol/openid-connect/auth',
  token_endpoint: 'http://localhost:8080/realms/MYB/protocol/openid-connect/token',
  userinfo_endpoint: 'http://localhost:8080/realms/MYB/protocol/openid-connect/userinfo',
  end_session_endpoint: 'http://localhost:8080/realms/MYB/protocol/openid-connect/logout',
  jwks_uri: 'http://localhost:8080/realms/MYB/protocol/openid-connect/certs',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['RS256'],
  code_challenge_methods_supported: ['S256'],
};

function makeTokenResponse(nonce: string) {
  const NOW = Math.floor(Date.now() / 1000);
  const accessToken = makeFakeJwt({
    sub: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
    iat: NOW,
    exp: NOW + 3600,
    jti: `fake-jti-${Date.now()}`,
    iss: 'http://localhost:8080/realms/MYB',
    aud: ['MYB-client', 'account'],
    typ: 'Bearer',
    azp: 'MYB-client',
    nonce,
    preferred_username: 'test.syndic',
    email: 'test.syndic@myb.test',
    given_name: 'Test',
    family_name: 'Syndic',
    email_verified: true,
    realm_access: { roles: ['coproperty-syndic', 'offline_access', 'uma_authorization'] },
    resource_access: { 'MYB-client': { roles: ['coproperty-syndic'] } },
    scope: 'openid email profile',
  });
  const refreshToken = makeFakeJwt({
    sub: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
    typ: 'Refresh',
    exp: NOW + 7200,
    iat: NOW,
    nonce,
  });
  const idToken = makeFakeJwt({
    sub: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
    iat: NOW,
    exp: NOW + 3600,
    iss: 'http://localhost:8080/realms/MYB',
    aud: 'MYB-client',
    nonce,
    email: 'test.syndic@myb.test',
    preferred_username: 'test.syndic',
  });
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_expires_in: 7200,
    session_state: 'fake-session-state',
    scope: 'openid email profile',
  };
}

export async function mockKeycloak(page: Page, copropertyId?: string): Promise<void> {
  // Set activeCopropertyId in localStorage before Angular bootstraps
  // so ActiveCopropertyService.activeId() returns the right value
  if (copropertyId) {
    await page.addInitScript(`
      try {
        localStorage.setItem('activeCopropertyId', '${copropertyId}');
      } catch(e) {}
    `);
  }

  // Track nonce across auth request → token exchange
  let capturedNonce = 'placeholder-nonce';

  // 1. OIDC discovery
  await page.route('**/realms/MYB/.well-known/openid-configuration', route =>
    route.fulfill({ json: OIDC_CONFIG })
  );

  // 2. Auth endpoint: capture nonce and redirect back with a fake auth code.
  //    keycloak-js uses checkLoginIframe: false, so it redirects the main page
  //    (not an iframe) to Keycloak with prompt=none and redirect_uri=<current page>.
  //    We must redirect back to that redirect_uri with code in the fragment.
  await page.route('**/realms/MYB/protocol/openid-connect/auth**', route => {
    const url = new URL(route.request().url());
    const nonce = url.searchParams.get('nonce');
    if (nonce) capturedNonce = nonce;

    const redirectUri = url.searchParams.get('redirect_uri') ?? '';
    const state = url.searchParams.get('state') ?? 'fake-state';
    const responseMode = url.searchParams.get('response_mode') ?? 'fragment';
    const isPromptNone = url.searchParams.get('prompt') === 'none';

    if (isPromptNone) {
      // keycloak-js sends response_mode=fragment → code in the URL fragment
      const sep = responseMode === 'fragment' ? '#' : '?';
      const callbackUrl = `${redirectUri}${sep}state=${state}&code=fake-auth-code-123&session_state=fake`;
      route.fulfill({
        contentType: 'text/html',
        body: `<html><body><script>window.location.replace(${JSON.stringify(callbackUrl)});</script></body></html>`,
      });
    } else {
      // Non-silent auth redirect — 200 empty to prevent navigation away
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
    }
  });

  // 3. Token exchange (code → access_token) — use the captured nonce
  await page.route('**/realms/MYB/protocol/openid-connect/token', route =>
    route.fulfill({ json: makeTokenResponse(capturedNonce) })
  );

  // 4. User profile (keycloak.loadUserProfile())
  await page.route('**/realms/MYB/account**', route =>
    route.fulfill({ json: USER_PROFILE })
  );

  // 5. JWKS (signature verification skipped by keycloak-js in this flow)
  await page.route('**/realms/MYB/protocol/openid-connect/certs', route =>
    route.fulfill({ json: { keys: [] } })
  );

  // 6. GraphQL (syncPreferredLanguage / confirmCurrentUserActivation)
  await page.route('**/graphql', route =>
    route.fulfill({ json: { data: { syncPreferredLanguage: true, confirmCurrentUserActivation: true } } })
  );

  // 7. i18n translation files
  await page.route('**/assets/i18n/**', route =>
    route.fulfill({ json: {} })
  );
}
