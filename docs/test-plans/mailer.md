# Mailer (consommateur RabbitMQ → SMTP)

**Sources** : `mailer-service/Myb.Mailer/Workers/EmailConsumerWorker.cs`, `Services/SmtpEmailSender.cs`, `Services/EmailTemplateRenderer.cs`, `InvalidEmailAddressException.cs` ; côté producteurs, `common/Myb.Common.Messaging` (`RabbitMqEmailPublisher`, `IEmailPublisher`).
**Outillage d'intégration** : RabbitMQ de test + serveur SMTP de capture (MailHog ou smtp4dev, par exemple).

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| MAIL-001 | `RabbitMqEmailPublisher.PublishAsync` | U,I | P1 | — | Message persistant publié dans la bonne file, au format JSON attendu |
| MAIL-002 | Message valide consommé | I | P1 | — | E-mail reçu par le serveur SMTP de capture ; message acquitté (ack) |
| MAIL-003 | Destinataire absent ou invalide | U | P1 | — | `InvalidEmailAddressException` → message supprimé immédiatement, sans nouvelle tentative |
| MAIL-004 | SMTP indisponible temporairement | U,I | P1 | — | Nouvelles tentatives après 2, 5, 15, 30 puis 60 s ; abandon au-delà, avec journalisation ; aucun e-mail en double après le rétablissement |
| MAIL-005 | RabbitMQ injoignable au démarrage | U | P2 | — | 5 tentatives avec délai croissant puis « Could not connect to RabbitMQ after multiple retries. » |
| MAIL-006 | ⚠ Compteur de tentatives indexé par le hash du corps du message | U | P3 | — | Deux e-mails identiques (même corps) partagent le compteur. Vérifier que ce n'est pas gênant, ou indexer par messageId |
| MAIL-007 | `EmailTemplateRenderer` en fr, en, ar (RTL) | U,V | P2 | — | Gabarit, logo et pied de page corrects ; `dir=rtl` en arabe ; capture HTML de référence |
| MAIL-008 | Données utilisateur injectées dans le gabarit (nom contenant `<script>`) | U | P1 | — | Contenu échappé |
| MAIL-009 | Catalogue des e-mails métier : activation de compte, appel de fonds créé, relance, versement validé ou rejeté, AG, confirmation de paiement | I | P2 | — | Un test par type : sujet, destinataire, liens profonds valides |
