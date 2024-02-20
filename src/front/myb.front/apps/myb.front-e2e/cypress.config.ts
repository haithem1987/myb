import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run myb.front:serve:development',
        production: 'nx run myb.front:serve:production',
      },
      ciWebServerCommand: 'nx run myb.front:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
