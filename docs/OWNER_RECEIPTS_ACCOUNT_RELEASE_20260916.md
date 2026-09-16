# Owner receipts and account release — 16 September 2026

Release images: `owner-fixes-20260916` in the existing OVH `myb` registry project (admin, client, coproperty).

- Receipts require a coproperty selection. The selected year is applied on initial load and refresh. Paid totals exclude pending/rejected proofs and retain currency separation.
- Current owner profiles update the syndic view; existing invoice and fund-call owner snapshots remain unchanged by profile edits.
- New account welcome emails include the email address and temporary password, use the selected UI language, and require email verification and a password change at first login.
- Activation sends the opted-in syndic an email in their preferred language and an in-app notification only after a verified login. Delivery failures retain the pending notification marker for the next login.
- Both apps share translated payment and report forms, statuses, payment methods, validation messages, and generated fund-call descriptions. Payment submission displays pending approval.
- Keycloak uses the `myb` email theme with French/English welcome and verification messages. Custom descriptions and historical document content are preserved.

## Deployment

Set the provided KUBECONFIG. Run `ovhcloud/scripts/configure-keycloak-email-theme.sh` to install the theme ConfigMap, mount it, and configure the existing realm. This keeps the current Keycloak image and credentials. The normal deployment script also creates the ConfigMap before mounting it.

## Validation

Both Nx OVH production builds passed. Backend suite: 18 tests passed. Receipt regression checks cover mandatory selection, coproperty/year isolation, approved-only totals, and currencies. Shared translation checks cover 792 keys in both apps and both languages. Existing payment/date checks also pass.

Production verification checks rollout readiness, public health/API responses, frontend translation assets, and Keycloak theme/language settings. Email delivery to real recipients requires a genuine new-account/verified-login flow; no unsolicited test email was sent.

Pre-existing workspace fixes were preserved in a separate prerequisite commit so this release can be reproduced from Git.
