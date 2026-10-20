import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';
import { createHash, randomBytes } from 'crypto';

function buildPkce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(96);
  let verifier = '';
  for (let i = 0; i < 96; i++) verifier += chars[bytes[i] % chars.length];
  const challenge = createHash('sha256').update(verifier).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const state = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');
  return { verifier, challenge, state, nonce };
}

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run admin:serve:development',
        production: 'nx run admin:serve:production',
      },
      ciWebServerCommand: 'nx run admin:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
    setupNodeEvents(on) {
      on('task', {
        generatePkce: () => buildPkce(),
        getKeycloakToken: async ({ username, password }: { username: string; password: string }) => {
          const kcUrl = process.env['KEYCLOAK_URL'] ?? 'http://localhost:8080';
          const realm = process.env['KEYCLOAK_REALM'] ?? 'MYB';
          const clientId = process.env['KEYCLOAK_CLIENT_ID'] ?? 'MYB-client';
          const body = new URLSearchParams({ grant_type: 'password', client_id: clientId, username, password, scope: 'openid' });
          const res = await fetch(`${kcUrl}/realms/${realm}/protocol/openid-connect/token`, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
          });
          if (!res.ok) throw new Error(`KC token failed ${res.status}: ${await res.text()}`);
          return res.json();
        },
      });
    },
  },
});
