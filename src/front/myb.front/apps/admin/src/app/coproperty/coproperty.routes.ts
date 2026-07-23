import { Routes } from '@angular/router';
import { COPROPERTY_ROUTES as LIB_COPROPERTY_ROUTES } from '@myb-front/coproperty-module';

/**
 * Admin-app re-export of the library's authoritative coproperty route tree.
 *
 * The single source of truth is `@myb-front/coproperty-module` so that the
 * syndic dashboard sidebar links (which use the URL paths declared in the
 * sidebar template) resolve in BOTH `nx-client` and `nx-admin`.
 *
 * If a cross-app navigation divergence is needed in the future, override
 * specific paths here (Angular merges the `children` arrays by path).
 */
export const COPROPERTY_ROUTES: Routes = LIB_COPROPERTY_ROUTES;
