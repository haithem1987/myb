# Sécurité transverse

**Sources** : `common/Myb.Common.Authentification/Security/RequestThreatDetector.cs` et `ApiSecurityExtensions.cs`, `document-management/.../DocumentUploadService.cs`, `FundCallService` (justificatifs), `notification-service/.../Security/CallerIdentity.cs`, `WhatsAppWebhookController.cs`, `coproperty/.../Controllers/InternalFundCallController.cs`.
**Tests existants** : `src/tests/unit-tests/security/` (RequestThreatDetector, DocumentUploadService), `notification/NotificationsControllerSecurityTests.cs`.

## SEC-THR — Détection de charges malveillantes

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| SEC-THR-001 | Corps de requête contenant `<script>`, `javascript:`, `data:text/html`, `onload=`, `$where`, `__proto__` (casse variée, espaces) | U,I | P1 | tous | Requête rejetée (code défini dans ApiSecurityExtensions) |
| SEC-THR-002 | Texte légitime proche : « description du script de l'AG », « onboarding » | U | P1 | — | Accepté : pas de faux positif |
| SEC-THR-003 | Corps de plus de 15 000 000 caractères | U | P2 | — | Comportement borné, sans exception ni scan complet |
| SEC-THR-004 | Charge malveillante placée dans les variables GraphQL plutôt que dans la query | I | P1 | — | Rejetée |

## SEC-UPL — Fichiers téléversés

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| SEC-UPL-001 | Document au-delà de 10 Mo, ou de 0 octet | U | P1 | — | Rejet « File size must be between… » |
| SEC-UPL-002 | Extension non autorisée (`.exe`, `.html`, `.svg`) | U | P1 | — | Rejet « type not allowed » |
| SEC-UPL-003 | MIME déclaré différent de l'extension | U | P1 | — | Rejet |
| SEC-UPL-004 | Signature binaire différente de l'extension (un PNG renommé en `.pdf`) | U | P1 | — | Rejet « signature does not match » |
| SEC-UPL-005 | Base64 invalide, ou data URL absente | U | P2 | — | Rejet |
| SEC-UPL-006 | Fichier signalé par l'antivirus | U | P1 | — | Rejet « rejected by the malware scanner » |
| SEC-UPL-007 | Nom de fichier avec traversée de chemin (`../../x.pdf`) | U | P1 | — | Rejet « Invalid file name » ou nom assaini |
| SEC-UPL-008 | Justificatif d'appel de fonds : formats PDF/JPG/PNG/WebP uniquement, 5 Mo maximum, nom et type obligatoires | U | P1 | OWN | Messages FR exacts de `FundCallService` (voir `COP-FC-04x`) |

## SEC-SVC — Appels entre services et endpoints anonymes

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| SEC-SVC-001 | `POST /api/notifications` pour le compte d'un autre userId, avec un jeton utilisateur du front | I | P1 | OWN | 403 (`CanActFor` refuse) |
| SEC-SVC-002 | Même appel avec un client de confiance (`azp=myb-backend`) | I | P1 | SVC | Accepté |
| SEC-SVC-003 | `GET /api/notifications/{userId}` pour un autre utilisateur | I | P1 | OWN | 403 |
| SEC-SVC-004 | `/internal/fund-calls/**` appelé avec un jeton utilisateur, ou sans jeton | I | P1 | OWN/ANON | Refusé. Vérifier que la route n'est pas exposée par nginx |
| SEC-SVC-005 | Webhook WhatsApp GET : `hub.verify_token` faux | U,I | P1 | ANON | 403 ; challenge renvoyé seulement si le token est correct |
| SEC-SVC-006 | ⚠ Webhook WhatsApp POST sans signature `X-Hub-Signature-256` valide | I | P1 | ANON | Doit être rejeté. **Risque** : aucune vérification de signature n'a été trouvée dans le contrôleur, donc n'importe qui peut forger des statuts de livraison |
| SEC-SVC-007 | `DevAuthMiddleware` du payment-service actif hors Development | I | P1 | — | Inactif en Production |
| SEC-SVC-008 | CORS : origine non autorisée sur chaque service | I | P2 | — | Pas d'en-tête `Access-Control-Allow-Origin` |
| SEC-SVC-009 | Introspection GraphQL et Banana Cake Pop en Production | I | P2 | ANON | Désactivés |
| SEC-SVC-010 | Messages d'erreur GraphQL en Production | I | P2 | — | Pas de stack trace ni de chaîne de connexion |
