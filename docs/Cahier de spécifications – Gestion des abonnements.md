# Cahier de spécifications – Gestion des abonnements

Oct 13, 2026 · @Khalifa Haithem

## 1. Contexte et objectifs

L'application gère déjà la création de compte et les droits des membres ; ce cahier ajoute la monétisation : qui paie, pour quoi, et ce qui se passe quand on ne paie plus.

**Objectifs**

- Permettre à un syndic de souscrire, modifier et résilier un abonnement en autonomie.
- Rattacher l'abonnement à la bonne entité pour que la facturation survive aux changements de syndic et de gestionnaire.
- Brancher les droits existants sur le statut d'abonnement et les quotas du plan.
- Produire des factures conformes (mentions légales, TVA, facture électronique).

**Dans le périmètre** : plans, souscription, essai, paiement récurrent, changement de plan, échecs de paiement, résiliation, factures, notifications, espace Forlink dans le module de facturation.

**Hors périmètre** : facturation des copropriétaires par le syndic (appels de fonds), programme de parrainage, revente en marque blanche, offre pour syndics professionnels (agences, cabinets) prévue ultérieurement.

**Hypothèses** retenues : contexte MYB ; la Résidence est l'entité qui porte déjà les membres, les lots et les droits ; le rôle « Membre syndic » existe dans le modèle de droits actuel ; cible actuelle : syndics bénévoles et coopératifs uniquement.

## 2. À qui rattacher l'abonnement

**Recommandation : l'abonnement est rattaché à la Résidence, jamais à un membre.** Tous les membres de la Résidence en bénéficient selon leurs droits ; seul un Membre syndic désigné comme **Titulaire de facturation** le gère.

| Option | Avantages | Risques | Verdict |
| --- | --- | --- | --- |
| Abonnement sur un membre « Membre syndic » | Simple à coder | Changement de syndic voté en AG ou départ du gestionnaire = perte de l'abonnement et de l'historique ; factures au nom d'une personne | À écarter |
| Abonnement sur la Résidence | Survit aux changements de syndic ; usage mesuré sur les lots de la Résidence ; un seul contrat pour tous les membres | Nécessite un rôle de facturation distinct | **Retenu** |
| Compte cabinet regroupant plusieurs Résidences | Facture consolidée pour un syndic professionnel multi-résidences | Entité supplémentaire à modéliser | Hors périmètre actuel : à prévoir avec l'offre agences et cabinets |

**Règles qui en découlent**

1. Une Résidence a au plus un abonnement actif à la fois.
2. Tout membre de la Résidence hérite des fonctionnalités du plan, dans la limite de ses droits actuels (l'abonnement ouvre des fonctionnalités, les rôles restent maîtres de qui fait quoi).
3. Le Titulaire de facturation est un Membre syndic de la Résidence ; il en faut toujours au moins un. Son départ impose d'en désigner un autre.
4. Changement de syndic : l'abonnement reste sur la Résidence ; le nouveau Membre syndic devient Titulaire, l'ancien perd l'accès à la facturation, les coordonnées de facturation sont mises à jour.
5. Syndic bénévole ou coopératif (cible actuelle) : le syndic bénévole élu en AG, ou le président du conseil syndical en syndic coopératif, est Titulaire par défaut.
6. Les copropriétaires, conseillers syndicaux et prestataires invités ne paient pas et ne voient jamais la facturation.

## 3. Forlink gère les abonnements dans le module de facturation de MYB

Forlink, éditeur de MYB, utilise le module de facturation existant comme n'importe quel émetteur : il y définit les abonnements comme des produits, fixe leurs prix et y suit factures, impayés et relances. Aucun second moteur de facturation n'est construit.

&#91;embedded content: Forlink, module de facturation, PSP et droits MYB\]

La Résidence souscrit par le tunnel, le module facture et encaisse via le PSP, puis chaque changement de statut met à jour les droits de la Résidence.

| Besoin Forlink | Fonction du module utilisée | Évolution du module si la fonction manque |
| --- | --- | --- |
| Définir les abonnements comme produits | Catalogue : un produit récurrent par plan et périodicité (Essentiel mensuel, Essentiel annuel, Confort mensuel, Confort annuel) ; quotas et fonctionnalités portés en attributs du produit | Produits récurrents et attributs personnalisés |
| Fixer les prix | Tarif par produit, versions de prix datées, remises et codes promo | Versionnage des prix, prix gelé pour les abonnés en cours |
| Gérer les abonnements | Contrat récurrent par Résidence cliente : produit, début, échéance, renouvellement tacite, résiliation | Changement de produit avec proratisation |
| Facturer | Facture automatique à chaque échéance, avoirs, PDF, envoi par email | Numérotation Forlink séparée de celle des syndics |
| Encaisser | Rapprochement des paiements carte et SEPA reçus du PSP | Connecteur PSP existant |
| Impayés et relances | Scénario de relance J+3, J+7, J+13 puis suspension à J+14 | Événement émis vers les droits MYB à chaque changement de statut |
| Piloter | MRR, abonnés par produit, churn, impayés | Tableau de bord à ajouter s'il n'existe pas |

**Règles**

- Forlink est une entité émettrice distincte dans le module ; ses clients sont les Résidences. Ses données ne sont jamais visibles des syndics, et inversement.
- L'espace Forlink du module est réservé à l'équipe Forlink (rôles internes : administration facturation, support, lecture comptable).
- Côté Résidence, la facture Forlink est une facture fournisseur reçue, consultable par le Titulaire dans « Abonnement MYB » ; elle n'est pas mélangée aux factures que le syndic émet.
- Pas de double saisie : le tunnel crée le Client et l'Abonnement dans le module par son API interne.
- Le module est la source de vérité du statut d'abonnement ; MYB n'en garde qu'une copie en cache pour le contrôle d'accès.
- Toute évolution du module pour Forlink (récurrence, relances, multi-émetteur) profite aussi aux syndics.

## 4. Modèle de données

Produits, abonnements, factures, paiements et relances vivent dans le module de facturation existant, sous l'entité Forlink ; MYB n'ajoute que le lien vers la Résidence et ses droits.

| Entité | Où | Champs principaux | Relations |
| --- | --- | --- | --- |
| Résidence (existante) | MYB | + client\_forlink\_id, n°\_immatriculation\_registre\_copropriétés | 1 ↔ 1 Client |
| Membre (existant) | MYB | + est\_titulaire\_facturation (booléen) | n → 1 Résidence |
| Client | Module, entité Forlink | nom du syndicat payeur, adresse, email de facturation, SIRET (si existant), id\_client\_psp | 1 → 0..1 Abonnement actif |
| Produit (plan) | Module, entité Forlink | code, libellé, type récurrent, périodicité, prix TTC et HT, version, quotas et fonctionnalités en attributs | 1 → n Abonnements |
| Abonnement | Module, entité Forlink | client, produit, statut, date\_début, date\_fin\_période, date\_fin\_essai, résiliation\_demandée\_le, id\_abonnement\_psp | n → 1 Client ; n → 1 Produit |
| Facture, avoir, paiement | Module, entité Forlink | numérotation propre à Forlink, montants, statut, PDF | n → 1 Abonnement |
| Relance | Module, entité Forlink | niveau, date, canal, résultat | n → 1 Facture |
| Droits de la Résidence | MYB | statut d'abonnement et quotas en cache, mis à jour par événement du module | 1 → 1 Résidence |

**Règles**

- Les prix et quotas d'un abonnement en cours sont figés sur la version du plan souscrite ; une hausse tarifaire ne s'applique qu'au renouvellement, après préavis.
- La source de vérité du paiement est le prestataire de paiement (PSP) ; l'application se synchronise via webhooks idempotents.
- Aucune donnée de carte n'est stockée côté application.

## 5. Offres et règles tarifaires

La métrique de facturation proposée est le nombre de lots de la Résidence, l'unité habituelle du métier de syndic ; les montants ci-dessous sont retenus pour le lancement.

| Plan | Cible | Prix TTC | Lots | Membres syndic | Fonctionnalités |
| --- | --- | --- | --- | --- | --- |
| Essai | Toute nouvelle Résidence, 30 jours | Gratuit | 150 | 2 | Celles du plan Confort |
| Essentiel | Petite Résidence en syndic bénévole | 19 €/mois ou 190 €/an | jusqu'à 20 | 2 (syndic et suppléant) | Lots, copropriétaires, documents, droits, appels de fonds |
| Confort | Résidence moyenne en syndic bénévole ou coopératif | 39 €/mois ou 390 €/an, puis 0,50 €/lot/mois au-delà de 60 lots | jusqu'à 60 inclus | 5 | Essentiel + assemblée générale en ligne, votes, relances automatiques, comptabilité simplifiée |

**Règles**

- Périodicité mensuelle ou annuelle ; l'annuel bénéficie d'une remise (2 mois offerts, soit environ 17 %).
- Prix affichés TTC en priorité : le syndicat ne récupère pas la TVA.
- Essai sans carte bancaire ; à son terme, passage en lecture seule tant qu'aucun plan n'est choisi.
- Un seul essai par Résidence (contrôle sur le n° d'immatriculation au registre des copropriétés).
- Codes promo : remise en % ou montant, durée limitée, applicables à la souscription uniquement.

## 6. Rôles et permissions liés à l'abonnement

Une seule nouvelle permission, « Gérer la facturation », portée par le Titulaire de facturation ; les autres rôles existants gardent leurs droits métier.

| Action | Titulaire de facturation (Membre syndic) | Autre Membre syndic | Copropriétaire / conseil syndical / invité | Équipe Forlink (module de facturation) |
| --- | --- | --- | --- | --- |
| Voir le plan et les quotas consommés | Oui | Oui | Non | Oui |
| Souscrire, changer de plan, de périodicité | Oui | Non | Non | Oui (geste commercial) |
| Modifier moyen de paiement et coordonnées de facturation | Oui | Non | Non | Non (PSP uniquement) |
| Télécharger les factures | Oui | Oui | Non | Oui |
| Résilier | Oui | Non | Non | Oui |
| Désigner un autre Titulaire de facturation | Oui | Non | Non | Oui |
| Inviter un Membre syndic (consomme un quota) | Selon droits actuels | Selon droits actuels | Non | Oui |

- Le premier Membre syndic de la Résidence devient Titulaire de facturation par défaut.
- Plusieurs Titulaires sont autorisés (ex. syndic bénévole et son suppléant).
- Toute action de facturation est tracée dans le journal d'abonnement.

## 7. Cycle de vie et parcours fonctionnels

L'abonnement d'une Résidence passe par sept statuts ; seul un paiement réussi la ramène en Actif.

&#91;embedded content: cycle de vie de l'abonnement d'une Résidence · 7 statuts\]

Sans régularisation, une Résidence suspendue passe en Résilié au bout de 60 jours, puis en Expiré 90 jours plus tard.

**Parcours**

1. **Souscription** : le Titulaire de facturation choisit plan et périodicité, saisit les coordonnées du payeur, paie via le PSP ; l'abonnement passe en Actif à réception du webhook de paiement, jamais sur simple retour navigateur.
2. **Upgrade** : effet immédiat, facturation au prorata de la période restante, quotas relevés aussitôt.
3. **Downgrade** : effet à l'échéance, refusé si l'usage dépasse les quotas du plan cible.
4. **Changement de périodicité** : mensuel vers annuel immédiat avec prorata ; annuel vers mensuel à l'échéance.
5. **Renouvellement** : automatique à la date de fin de période ; préavis J-30 pour l'annuel.
6. **Échec de paiement** : relances PSP à J+3, J+7, J+13 ; Impayé pendant 14 jours, puis Suspendu.
7. **Résiliation** : à l'initiative du Titulaire, motif demandé (facultatif), effet en fin de période, annulable jusque-là ; aucun remboursement au prorata sauf geste commercial.
8. **Changement de syndic** : transfert du rôle de Titulaire au nouveau Membre syndic et mise à jour du payeur, sans interruption de l'abonnement.

## 8. Tunnel d'abonnement

Le tunnel tient en cinq étapes, toutes réservées au Titulaire de facturation de la Résidence ; l'abonnement n'est activé qu'à réception du webhook du PSP.

&#91;embedded content: tunnel d'abonnement · 5 étapes, 1 décision\]

Un paiement refusé renvoie à l'étape 4 sans perdre les saisies précédentes.

| Étape | Écran et contenu | Règles |
| --- | --- | --- |
| Point d'entrée | Bandeau de fin d'essai, page « Abonnement » des paramètres de la Résidence, blocage de quota (ajout de lots, invitation d'un Membre syndic) | Visible uniquement par le Titulaire ; un autre membre voit « Contactez votre Titulaire de facturation » et un bouton qui lui envoie une demande |
| 1. Choix du plan | Comparatif des plans, bascule mensuel / annuel avec remise affichée, plan recommandé selon le nombre de lots de la Résidence | Plans dont les quotas sont inférieurs à l'usage actuel grisés, avec le motif |
| 2. Payeur | Payeur : le syndicat de copropriétaires représenté par le syndic bénévole ; nom, adresse, email de facturation, SIRET du syndicat s'il en a un ; n° d'immatriculation de la Résidence prérempli | SIRET facultatif, vérifié via l'API Sirene s'il est saisi ; champs préremplis si déjà connus |
| 3. Récapitulatif | Plan, périodicité, prix HT, TVA, TTC, prorata en cas d'upgrade, date du prochain prélèvement, champ code promo | Case CGV obligatoire ; acceptation horodatée avec la version des CGV ; montants recalculés côté serveur |
| 4. Paiement | Composant hébergé du PSP : carte avec 3-D Secure ou mandat SEPA | Aucune donnée bancaire ne transite par MYB ; double clic neutralisé par une clé d'idempotence |
| Attente | Écran « Paiement en cours » jusqu'au webhook | Au-delà de 2 minutes : message « vous serez prévenu par email », l'abonnement s'activera au webhook |
| 5. Abonnement actif | Écran de succès, plan et quotas mis à jour, lien vers la facture | Email de confirmation + facture au Titulaire, notification aux Membres syndic, entrée au journal d'abonnement |

**Cas particuliers**

- **SEPA** : abonnement activé à la signature du mandat ; un rejet de prélèvement quelques jours plus tard fait passer la Résidence en Impayé.
- **Abandon** : saisies conservées 7 jours ; email de relance au Titulaire à J+1 (une seule fois).
- **Upgrade depuis un abonnement actif** : le tunnel saute l'étape 2 et présente directement le récapitulatif avec le prorata.
- **Fin d'essai** : le choix du plan est proposé avec les quotas déjà consommés pendant l'essai.
- **Mobile** : chaque étape tient sur un écran, barre de progression 1 à 5 visible.

**Mesure** : taux de passage par étape, taux d'abandon au paiement et délai médian entre entrée et activation, suivis dans le tableau de bord du back-office.

## 9. Contrôle d'accès selon statut et quotas

Chaque requête vérifie, après les droits du rôle, deux choses : le statut de l'abonnement de la Résidence et le quota concerné.

| Statut | Accès membres syndic | Accès copropriétaires | Facturation |
| --- | --- | --- | --- |
| Essai | Complet (plan Confort) | Complet | Accessible |
| Actif | Complet selon plan | Complet | Accessible |
| Impayé (période de grâce, 14 jours) | Complet + bandeau d'alerte | Complet | Accessible |
| Suspendu | Lecture seule + export | Lecture seule | Accessible pour régulariser |
| Résilié (fin de période atteinte) | Lecture seule + export pendant 90 j | Aucun | Accessible |
| Expiré (après 90 j) | Aucun ; données anonymisées ou supprimées selon RGPD | Aucun | Factures conservées 10 ans |

**Quotas**

- Contrôlés à la création : ajout de lots, invitation d'un Membre syndic.
- Dépassement : blocage de la création avec proposition de passer au plan supérieur ; aucune donnée existante n'est bloquée.
- Alerte au Titulaire de facturation à 80 % puis 100 % d'un quota.
- Downgrade refusé tant que l'usage dépasse les quotas du plan cible (message listant les écarts).

**Implémentation** : un service central `EntitlementService.peut(residence, fonctionnalité | quota)` appelé côté API ; l'interface n'est qu'un reflet, jamais la seule barrière.

## 10. Facturation, paiement et conformité

Forlink émet ses factures depuis le module de facturation de MYB, avec sa propre numérotation ; l'encaissement passe par un PSP relié au module.

**Moyens de paiement** : carte bancaire et prélèvement SEPA sur le compte bancaire séparé du syndicat (adapté à l'annuel).

**Factures**

- Émises à chaque échéance et à chaque changement de plan (proratisation).
- Mentions obligatoires : dénomination, SIRET et n° de TVA de MYB, nom et adresse du syndicat client (et son SIRET s'il existe), numéro séquentiel, date, désignation, HT, taux et montant de TVA, TTC, date d'échéance, pénalités de retard et indemnité forfaitaire de 40 €.
- Avoir obligatoire en cas de remboursement ; jamais de modification d'une facture émise.
- Conservation 10 ans.

**Facture électronique** : depuis le 1er septembre 2026, les entreprises assujetties à la TVA doivent pouvoir recevoir des factures électroniques, et l'émission devient obligatoire pour les PME et TPE le 1er septembre 2027 ([La Poste](https://www.laposte.fr/entreprise-collectivites/actualites/calendrier-dematerialisation-factures-en-est-votre-entreprise)). Nos clients actuels, des syndicats gérés bénévolement, sont en général non assujettis à la TVA : la vente relève alors de l'e-reporting côté MYB plutôt que de la facture électronique B2B (à confirmer avec l'expert-comptable). L'émission via une plateforme agréée deviendra nécessaire avec l'offre agences et cabinets.

**RGPD** : données de facturation conservées au titre de l'obligation comptable ; données métier supprimées ou anonymisées 90 jours après expiration ; PSP déclaré comme sous-traitant ; export complet disponible avant suppression.

## 11. Notifications, back-office et exigences non fonctionnelles

**Notifications (email + in-app, au Titulaire de facturation)**

| Événement | Délai |
| --- | --- |
| Fin d'essai approchant | J-7 et J-1 |
| Facture émise / paiement réussi | Immédiat |
| Échec de paiement | Immédiat, puis J+3, J+7, J+13 |
| Suspension | Immédiat (copie à tous les Membres syndic) |
| Renouvellement annuel à venir | J-30 |
| Quota à 80 % / 100 % | Immédiat |
| Résiliation confirmée, fin d'accès approchant | Immédiat, puis J-7 avant fin de période |
| Changement de Titulaire de facturation | Immédiat, à l'ancien et au nouveau |

**Espace Forlink (module de facturation)**

- Recherche d'une Résidence cliente : abonnement, factures, relances et journal.
- Gestes commerciaux depuis le module : prolonger un essai, appliquer une remise, offrir un mois, réactiver une Résidence suspendue.
- Tableau de bord : MRR, abonnés par produit, churn, impayés en cours.

**Exigences non fonctionnelles**

- Webhooks PSP idempotents, rejouables, avec réconciliation quotidienne PSP ↔ base.
- Contrôle des droits en moins de 50 ms (cache du statut et des quotas, invalidé à chaque événement).
- Aucune donnée de carte stockée ; conformité PCI-DSS déléguée au PSP.
- Journal d'audit immuable de toutes les actions de facturation.
- Environnement de test PSP séparé avec cartes et IBAN de test.

## 12. Critères d'acceptation, choix retenus et lots

**Critères d'acceptation**

- [ ] Un Membre syndic non titulaire ne peut ni voir les moyens de paiement ni modifier l'abonnement (API renvoie 403).
- [ ] La suppression du dernier Titulaire de facturation est bloquée.
- [ ] Le départ d'un Membre syndic ne modifie ni l'abonnement ni les factures de la Résidence.
- [ ] L'ajout de lots au-delà du quota est refusée avec proposition d'upgrade.
- [ ] Un échec de paiement fait passer la Résidence en Impayé, puis Suspendu à J+14 sans régularisation.
- [ ] Une régularisation repasse la Résidence en Actif en moins d'une minute.
- [ ] Un upgrade est facturé au prorata et effectif immédiatement ; un downgrade prend effet à l'échéance.
- [ ] Chaque facture porte un numéro séquentiel unique et les mentions obligatoires.
- [ ] Un même webhook reçu deux fois ne produit qu'un seul effet.

**Choix retenus**

- **Module de facturation** : les fonctions manquantes (produits récurrents, proratisation, scénarios de relance, multi-émetteur avec numérotation séparée) sont développées dans le module au lot 1, jamais contournées.
- **PSP** : Stripe, pour la carte et le prélèvement SEPA, relié au module ; le module reste la source de vérité.
- **Métrique de facturation** : le nombre de lots de la Résidence.
- **Prix** : Essentiel 19 € TTC/mois, Confort 39 € TTC/mois, 2 mois offerts en annuel, 0,50 € TTC par lot et par mois au-delà de 60 lots.
- **Payeur** : le syndicat de copropriétaires, depuis son compte bancaire séparé ; la dépense est inscrite au budget prévisionnel voté en AG. En attendant ce vote, le syndic bénévole peut payer par carte au nom du syndicat.
- **Pas d'offre gratuite permanente** : l'essai de 30 jours et le plan Essentiel couvrent les très petites Résidences.
- **Délais** : période de grâce de 14 jours, résiliation 60 jours après la suspension, conservation des données 90 jours après la résiliation.
- **Factures** : visibles en lecture par tous les Membres syndic ; seul le Titulaire paie et modifie l'abonnement.

**Découpage retenu**

1. Lot 1 : Forlink comme entité émettrice dans le module, catalogue de produits et prix, lien Résidence ↔ Client, Titulaire de facturation, EntitlementService.
2. Lot 2 : abonnements récurrents dans le module, tunnel de souscription, paiement carte, statuts Essai et Actif.
3. Lot 3 : changement de plan, proratisation, quotas, impayés et relances du module, suspension, notifications.
4. Lot 4 : SEPA, résiliation et rétention, tableau de bord Forlink.
5. Lot 5 (ultérieur) : offre agences et cabinets, compte multi-résidences, facture électronique via plateforme agréée.

## Sources

- [Calendrier de dématérialisation des factures, La Poste](https://www.laposte.fr/entreprise-collectivites/actualites/calendrier-dematerialisation-factures-en-est-votre-entreprise)
- [Calendrier de la facturation électronique, Keobiz](https://www.keobiz.fr/le-mag/facturation-electronique-calendrier-2026-2027/)
