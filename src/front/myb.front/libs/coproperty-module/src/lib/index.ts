// Internal barrel for components inside the lib to import services/models
// without circular dependency (does NOT re-export components)
export * from './services';
export * from './models';
export { profileGuard, noProfileGuard, completeProfileGuard } from './guards/profile.guard';
