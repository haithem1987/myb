/** Match persisted system messages without translating names, descriptions or reasons.
 * Keep the original message for user-authored content and unknown event types.
 */
const systemMessages: { key: string; patterns: RegExp[] }[] = [
  { key: 'profileUpdated', patterns: [/^(.+) a mis à jour son profil\.$/s, /^(.+) updated their profile\.$/s] },
  { key: 'accountActivated', patterns: [/^(.+) a vérifié son adresse e-mail et accédé à son compte MYB\.$/s, /^(.+) verified their email and accessed their MYB account\.$/s] },
  { key: 'fundUpdated', patterns: [/^L'appel de fonds « (.*) » a été mis à jour\.$/s, /^The call for funds “(.*)” was updated\.$/s] },
  { key: 'fundStatusUpdated', patterns: [/^Le statut de l'appel de fonds « (.*) » a été mis à jour\.$/s] },
  { key: 'fundCancelled', patterns: [/^L'appel de fonds « (.*) » a été annulé\. Motif : (.*)$/s] },
  { key: 'paymentApproved', patterns: [/^Votre paiement de (.+?) pour « (.*) » a été validé\.$/s] },
  { key: 'paymentRejectedReason', patterns: [/^Votre paiement de (.+?) pour « (.*) » a été rejeté\. Motif : (.*)$/s] },
  { key: 'paymentRejected', patterns: [/^Votre paiement de (.+?) pour « (.*) » a été rejeté\.$/s] },
  { key: 'fundPaymentReceived', patterns: [/^💰 Paiement reçu : (.+?) a versé (.+?) \((.*?)\) pour "(.*)"\. (.*)$/s] },
  { key: 'chargePaymentReceived', patterns: [/^💰 Paiement reçu : (.+?) a payé (.+?) pour la charge "(.*)" \(Lot (.*?)\)$/s] },
  { key: 'ownershipRemoved', patterns: [/^Vous n'êtes plus enregistré comme propriétaire du lot (.+?) de la copropriété (.*)\. Vos données et documents historiques restent inchangés\.$/s] },
  { key: 'ownershipAssigned', patterns: [/^Vous êtes désormais enregistré comme propriétaire du lot (.+?) de la copropriété (.*)\.$/s] },
  { key: 'timesheetUpdated', patterns: [/^Timesheet updated by (.*)$/s] },
  { key: 'timesheetApproved', patterns: [/^(?:Your timesheet has been approved\.|Votre feuille de temps a été approuvée\.)$/] },
  { key: 'timesheetRejected', patterns: [/^(?:Your timesheet has been rejected\.|Votre feuille de temps a été rejetée\.)$/] },
];

export function translateNotificationMessage(
  message: string,
  translate: { instant(key: string, params?: Record<string, string>): string }
): string {
  for (const event of systemMessages) {
    for (const pattern of event.patterns) {
      const match = message.match(pattern);
      if (!match) continue;
      const params: Record<string, string> = {};
      match.slice(1).forEach((value, index) => { params[`p${index + 1}`] = value; });
      if (event.key === 'fundPaymentReceived') {
        if (params['p3'] === 'Virement') params['p3'] = translate.instant('notificationUi.bankTransfer');
        if (params['p5'] === 'ENTIÈREMENT RÉGLÉ') {
          params['p5'] = translate.instant('notificationUi.fullySubmitted');
        } else if (params['p5'].startsWith('Reste à payer : ')) {
          params['p5'] = translate.instant('notificationUi.remainingSubmitted', { amount: params['p5'].slice('Reste à payer : '.length) });
        }
      }
      return translate.instant(`notificationUi.${event.key}`, params);
    }
  }
  return message;
}
