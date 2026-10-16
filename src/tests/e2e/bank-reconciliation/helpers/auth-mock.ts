import { Page } from '@playwright/test';

// Minimal fake JWT — keycloak-js parses claims but doesn't verify signature client-side
function makeFakeJwt(claims: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify(claims)).replace(/=/g, '');
  return `${header}.${payload}.fakesignature`;
}

const NOW = Math.floor(Date.now() / 1000);

export const FAKE_ACCESS_TOKEN = makeFakeJwt({
  sub: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
  iat: NOW,
  exp: NOW + 3600,
  jti: 'fake-jti',
  iss: 'http://localhost:8080/realms/MYB',
  aud: 'MYB-client',
  typ: 'Bearer',
  preferred_username: 'test.syndic',
  email: 'test.syndic@myb.test',
  given_name: 'Test',
  family_name: 'Syndic',
  email_verified: true,
  realm_access: { roles: ['coproperty-syndic', 'offline_access', 'uma_authorization'] },
  resource_access: { 'MYB-client': { roles: ['coproperty-syndic'] } },
});

export const FAKE_REFRESH_TOKEN = makeFakeJwt({
  sub: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
  typ: 'Refresh',
  exp: NOW + 7200,
  iat: NOW,
});

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

export const TOKEN_RESPONSE = {
  access_token: FAKE_ACCESS_TOKEN,
  refresh_token: FAKE_REFRESH_TOKEN,
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_expires_in: 7200,
  session_state: 'fake-session-state',
  scope: 'openid email profile',
};

export const USER_PROFILE = {
  id: 'e8f3c2a1-1234-5678-abcd-ef0123456789',
  username: 'test.syndic',
  firstName: 'Test',
  lastName: 'Syndic',
  email: 'test.syndic@myb.test',
  emailVerified: true,
  attributes: {},
};

export async function mockKeycloak(page: Page): Promise<void> {
  // 1. OIDC discovery
  await page.route('**/realms/MYB/.well-known/openid-configuration', route =>
    route.fulfill({ json: OIDC_CONFIG })
  );

  // 2. Silent check-sso iframe: redirect back with a fake auth code
  await page.route('**/realms/MYB/protocol/openid-connect/auth**', route => {
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get('redirect_uri') ?? '';
    const state = url.searchParams.get('state') ?? 'fake-state';
    const isPromptNone = url.searchParams.get('prompt') === 'none';

    if (isPromptNone && redirectUri.includes('silent-check-sso')) {
      // Return the silent-check-sso page with a code in the fragment
      const callbackUrl = `${redirectUri}#state=${state}&code=fake-auth-code-123&session_state=fake`;
      route.fulfill({
        contentType: 'text/html',
        body: `<html><body><script>
          // Simulate the redirect from Keycloak
          window.location.replace(${JSON.stringify(callbackUrl)});
        </script></body></html>`,
      });
    } else {
      // Non-silent auth redirect — just return a 200 to avoid real Keycloak
      route.fulfill({ status: 200, body: '' });
    }
  });

  // 3. Token exchange (code → access_token)
  await page.route('**/realms/MYB/protocol/openid-connect/token', route =>
    route.fulfill({ json: TOKEN_RESPONSE })
  );

  // 4. User profile
  await page.route('**/realms/MYB/account**', route =>
    route.fulfill({ json: USER_PROFILE })
  );

  // 5. JWKS (signature verification skipped by keycloak-js in this flow)
  await page.route('**/realms/MYB/protocol/openid-connect/certs', route =>
    route.fulfill({ json: { keys: [] } })
  );

  // 6. GraphQL (syncPreferredLanguage / confirmCurrentUserActivation)
  await page.route('**/graphql', route => {
    route.fulfill({ json: { data: { syncPreferredLanguage: true, confirmCurrentUserActivation: true } } });
  });

  // 7. i18n translation files
  await page.route('**/assets/i18n/**', route =>
    route.fulfill({ json: {} })
  );
}
