# WhatsApp (configuration par copropriété, envoi, webhook)

**Sources** : `WhatsAppConfigController` (`/api/coproperty/{copropertyId}/whatsapp-config` GET/PUT/DELETE), `WhatsAppConfigService` (chiffrement du jeton via Data Protection), `WhatsAppSender`, `WhatsAppWebhookController` (`/api/whatsapp/webhook` GET verify, POST status), `Configuration/WhatsAppOptions.cs`. Front : `syndic-settings`.
**Tests existants** : `unit-tests/notification/WhatsAppTests.cs`.

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| NOT-WA-001 | PUT d'une configuration (phoneNumberId, jeton d'accès) | I,E | P2 | SYN | Configuration enregistrée ; le jeton est **chiffré** en base |
| NOT-WA-002 | GET de la configuration | I | P1 | SYN | Le jeton n'est jamais renvoyé en clair (masqué ou absent) |
| NOT-WA-003 | GET, PUT ou DELETE par un utilisateur qui n'est pas gestionnaire | I | P1 | OWN | 403 |
| NOT-WA-004 | ⚠ `syn-a` configure ou lit la configuration WhatsApp de COPRO-B | I | P1 | SYN | Attendu : 403. **Risque** : `IsManager()` vérifie seulement le rôle, pas que la copropriété appartient à l'appelant |
| NOT-WA-005 | GET quand aucune configuration n'existe | I | P3 | SYN | 404 |
| NOT-WA-006 | DELETE | I | P3 | SYN | Configuration supprimée ; les envois suivants passent sur la configuration globale ou sont désactivés |
| NOT-WA-007 | Envoi : la configuration de la copropriété est prioritaire sur la configuration globale | U | P1 | — | Le bon jeton et le bon numéro sont utilisés |
| NOT-WA-008 | Envoi vers un propriétaire sans téléphone, ou avec un numéro invalide (normalisation E.164) | U | P2 | — | Envoi ignoré, journalisé dans `CommunicationLog` en échec |
| NOT-WA-009 | L'API Meta renvoie une erreur (401, 429) | U | P2 | — | Échec journalisé ; pas de boucle de nouvelles tentatives |
| NOT-WA-010 | Webhook GET avec le bon token et `hub.mode=subscribe` | U,I | P1 | ANON | 200 + challenge renvoyé tel quel |
| NOT-WA-011 | Webhook GET avec un mauvais token | U,I | P1 | ANON | 403 |
| NOT-WA-012 | Webhook POST de statut (sent, delivered, read, failed) | I | P2 | ANON | `CommunicationLog` correspondant mis à jour |
| NOT-WA-013 | ⚠ Webhook POST forgé (sans signature) | I | P1 | ANON | Voir SEC-SVC-006 |
