# Cahier de spécifications – Pages d'accueil MYB

Oct 13, 2026 · @Khalifa Haithem

## 1. Faut-il deux pages ?

**Oui : deux pages distinctes, plus des variantes de campagne.** Le prospect venu d'une publicité doit être convaincu de lancer un essai ; l'abonné doit retrouver son travail en un clic. Une seule page servirait mal les deux.

&#91;embedded content: routage des visiteurs · 2 pages principales, 1 variante de campagne\]

Les pages de campagne sont des déclinaisons de l'accueil public, pas une troisième page à concevoir. Le tunnel d'abonnement est décrit dans Cahier de spécifications – Gestion des abonnements.

|  | Accueil public | Accueil abonné |
| --- | --- | --- |
| Public | Syndics bénévoles qui ne connaissent pas MYB | Membres d'une Résidence abonnée ou en essai |
| Objectif | Démarrer un essai gratuit | Accéder vite aux tâches du jour, découvrir les fonctions du plan |
| Emplacement | Site vitrine (racine du domaine) | Application, après connexion |
| Accès | Public, référencé | Authentifié, non référencé |
| Indicateur clé | Taux visite → essai démarré | Taux d'essai converti, rétention |

**Règles de passage**

- Un visiteur déjà connecté qui arrive sur l'accueil public n'est pas redirigé de force : l'en-tête affiche « Accéder à mon espace » à la place de « Essai gratuit ».
- La connexion mène toujours à l'accueil abonné ; la fin du tunnel aussi.

## 2. Objectifs et indicateurs

Chaque page a un seul objectif principal, mesuré par un seul indicateur de décision ; cibles de lancement : 3 % des visites de l'accueil public converties en essai, au plus 40 € par essai démarré sur les campagnes, 25 % des essais convertis en abonnement payant.

| Page | Objectif principal | Indicateur de décision | Indicateurs de suivi |
| --- | --- | --- | --- |
| Accueil public | Démarrer un essai gratuit | Taux visite → essai démarré | Taux de clic sur le bouton principal, défilement jusqu'aux tarifs, rebond |
| Pages de campagne | Démarrer un essai depuis un canal payant | Coût par essai démarré, par canal | Taux de conversion par annonce, qualité du trafic (essais activés à J+7) |
| Accueil abonné | Faire revenir et convertir l'essai | Taux d'essais convertis en abonnement payant | Membres actifs par semaine, fonctions clés utilisées, renouvellements |

La mesure suit tout le chemin : annonce → page → essai → abonnement payant, grâce aux paramètres UTM conservés jusqu'à la souscription.

## 3. Cible et messages

La cible est le syndic bénévole ou coopératif : un copropriétaire qui gère sa résidence sur son temps libre, sans formation juridique ni comptable, souvent avec des tableurs et des emails.

| Ce qu'il vit | Message MYB | Preuve à montrer |
| --- | --- | --- |
| Peur de commettre une erreur juridique ou comptable | « Gérez votre copropriété sereinement, sans être expert » | Étapes guidées, modèles de documents conformes |
| Temps perdu en relances, appels de fonds, convocations | « Quelques minutes par semaine suffisent » | Tâches automatisées montrées en capture |
| Difficulté à rendre des comptes aux copropriétaires | « Tout est transparent et partagé » | Espace copropriétaires, documents en ligne |
| Crainte du coût | « Moins cher qu'un syndic professionnel » | Prix affiché TTC, essai gratuit sans carte bancaire |

**Ton** : simple, rassurant, concret ; vocabulaire de copropriétaire, pas de jargon logiciel. Ces formulations sont retenues pour le lancement, puis optimisées par tests A/B.

## 4. Accueil public : structure

La page se lit de haut en bas comme un argumentaire ; le bouton « Essai gratuit » est visible à tout moment.

| # | Bloc | Contenu | Bouton |
| --- | --- | --- | --- |
| 1 | En-tête fixe | Logo, Fonctionnalités, Tarifs, FAQ, Se connecter | « Essai gratuit » (ou « Accéder à mon espace » si connecté) |
| 2 | Promesse | Titre centré sur le bénéfice, sous-titre, capture de l'application, mention « 30 jours gratuits, sans carte bancaire » | « Démarrer mon essai gratuit » |
| 3 | Problèmes | 3 situations vécues par le syndic bénévole (voir section 3) | — |
| 4 | Solution | 3 à 4 fonctions clés avec capture : lots et copropriétaires, documents, appels de fonds, assemblée générale | — |
| 5 | Comment ça marche | 3 étapes : créer la résidence, inviter les copropriétaires, gérer au quotidien | « Essayer gratuitement » |
| 6 | Preuves | Témoignages de syndics bénévoles, nombre de résidences, logos presse si disponibles | — |
| 7 | Tarifs | Plans Essentiel (19 €/mois) et Confort (39 €/mois), prix TTC, bascule mensuel / annuel, essai gratuit rappelé | « Choisir ce plan » (lance l'essai avec le plan présélectionné) |
| 8 | Sécurité et confiance | Hébergement en France ou UE, RGPD, sauvegardes, support humain | — |
| 9 | FAQ | 6 à 8 questions : durée de l'essai, résiliation, données, aide au démarrage, vote en AG de la dépense | — |
| 10 | Appel final | Rappel de la promesse | « Démarrer mon essai gratuit » |
| 11 | Pied de page | Mentions légales, CGV, confidentialité, cookies, contact | — |

**Règles**

- Un seul appel à l'action principal par écran ; les liens secondaires restent discrets.
- Bouton fixe en bas d'écran sur mobile après le bloc 2.
- Les témoignages et chiffres affichés doivent être réels et vérifiables ; aucun avis inventé.

## 5. Pages de campagne

Chaque campagne pointe vers une page courte qui reprend mot pour mot la promesse de l'annonce ; elle réutilise les blocs de l'accueil public, sans menu de navigation pour ne pas disperser le visiteur.

| Canal | Intention du visiteur | Angle de la page | Blocs retenus |
| --- | --- | --- | --- |
| Google Ads (recherche) | Cherche activement une solution (« logiciel syndic bénévole ») | Comparatif avec tableur et syndic professionnel | Promesse, solution, tarifs, FAQ, appel final |
| Meta (Facebook, Instagram) | Découvre le sujet, peu informé | Problème vécu puis solution simple | Promesse, problèmes, comment ça marche, preuves, appel final |
| Emailing, partenaires | Recommandé par un tiers | Confiance et offre dédiée (code promo) | Promesse, preuves, tarifs avec code appliqué, appel final |

**Règles**

- URL dédiée par campagne, non indexée (balise noindex), paramètres UTM conservés jusqu'à la souscription.
- Titre de la page identique à l'accroche de l'annonce.
- Formulaire d'essai réduit au minimum : email et nom de la résidence ; le reste est demandé dans l'application.
- Pages créées depuis des blocs réutilisables par l'équipe marketing, sans développement.
- Tests A/B sur le titre et le bouton principal, un test à la fois.

## 6. Accueil abonné

L'accueil abonné est le tableau de bord de la Résidence : il montre d'abord ce qui demande une action, puis s'adapte au statut d'abonnement et au rôle du membre.

**Blocs communs**

1. **À faire** : échéances et tâches en attente (appel de fonds, AG à convoquer, documents à valider).
2. **Raccourcis** : 4 actions les plus fréquentes selon le rôle.
3. **Activité récente** : derniers documents, messages, paiements reçus.
4. **Aide** : guide de démarrage, contact support.

**Variations selon le statut** (vu par le Titulaire de facturation ; les autres membres voient une version allégée)

| Statut | Bandeau | Bloc spécifique |
| --- | --- | --- |
| Essai | « Il vous reste N jours d'essai » + « Choisir mon plan » | Liste de démarrage : créer les lots, inviter les copropriétaires, importer les documents (avec progression) |
| Actif | Aucun | Quotas consommés si au-delà de 80 % ; nouveautés du plan |
| Impayé | « Paiement en échec, mettez à jour votre moyen de paiement » | Lien direct vers le paiement |
| Résiliation programmée | « Votre accès prend fin le JJ/MM » + « Annuler la résiliation » | — |
| Suspendu ou Résilié | « Lecture seule » + « Réactiver » | Export des données |

**Variations selon le rôle** : un copropriétaire ne voit ni bandeau de facturation ni quotas ; il voit ses documents, ses appels de fonds et les annonces de la Résidence.

**Règles** : aucune publicité ni montée en gamme agressive ; une seule suggestion de plan supérieur, uniquement quand un quota est atteint.

## 7. Exigences techniques

L'accueil public et les pages de campagne relèvent du site vitrine, rapide et référencé ; l'accueil abonné relève de l'application.

| Domaine | Accueil public et campagnes | Accueil abonné |
| --- | --- | --- |
| Référencement | Rendu côté serveur ou statique, balises titre et description, données structurées (Organization, Product, FAQPage), sitemap ; campagnes en noindex | Non indexé |
| Performance | Bon score Core Web Vitals sur mobile ; images optimisées, chargement différé | Affichage des blocs « À faire » en moins de 2 s |
| Mesure | Matomo, configuré pour l'exemption de consentement de la CNIL ; pixels Google et Meta chargés seulement après accord ; UTM conservés jusqu'à l'essai | Événements produit (activation, fonctions utilisées) |
| Cookies | Bandeau de consentement conforme aux recommandations de la CNIL : refuser aussi simple qu'accepter | Cookies strictement nécessaires uniquement |
| Accessibilité | Conformité RGAA visée : contrastes, navigation clavier, textes alternatifs | Idem |
| Mobile | Conception mobile d'abord ; bouton d'essai fixe | Raccourcis utilisables au pouce |
| Édition | Webflow : blocs gérés par le marketing sans développement | Contenus pilotés par l'application |

## 8. Critères d'acceptation, choix retenus et lots

**Critères d'acceptation**

- [ ] Depuis l'accueil public, un visiteur démarre un essai en 2 clics maximum.
- [ ] Un visiteur connecté voit « Accéder à mon espace » au lieu de « Essai gratuit ».
- [ ] Une page de campagne reprend l'accroche de son annonce et n'est pas indexée.
- [ ] Les paramètres UTM d'une visite se retrouvent sur l'essai et l'abonnement créés.
- [ ] Aucun pixel publicitaire n'est chargé avant consentement.
- [ ] L'accueil abonné affiche le bandeau correspondant à chacun des statuts d'abonnement.
- [ ] Un copropriétaire ne voit aucune information de facturation.
- [ ] L'équipe marketing crée une page de campagne sans intervention technique.

**Choix retenus**

- **Domaines** : site vitrine et pages de campagne sur le domaine principal de MYB ; application sur le sous-domaine app.
- **Outil** : Webflow pour le site vitrine et les pages de campagne ; l'accueil abonné est développé dans l'application.
- **Mesure** : Matomo sans cookie publicitaire ; pixels Google et Meta chargés seulement après consentement.
- **Preuves** : lancement avec 3 témoignages de Résidences pilotes ; le bloc Preuves reste masqué tant qu'ils ne sont pas recueillis.
- **Canaux** : 1 500 € par mois au premier trimestre, 70 % Google Ads (recherche) et 30 % Meta, réalloués chaque mois selon le coût par essai.
- **Vidéo** : démonstration de 60 secondes sous la promesse (bloc 2), produite au lot 3.

**Découpage retenu**

1. Lot 1 : accueil public (blocs 1 à 11), consentement, mesure avec UTM.
2. Lot 2 : accueil abonné, blocs communs et bandeaux par statut.
3. Lot 3 : gabarit de page de campagne, première page Google Ads et première page Meta, tests A/B, vidéo de démonstration.
