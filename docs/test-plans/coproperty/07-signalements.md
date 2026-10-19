# Signalements

**Sources** : `SignalementMutations` (CreateSignalement, UpdateSignalementStatus, IncrementSignalementViews, DeleteSignalement), `SignalementQueries` (GetSignalements, ByStatus, GetSyndicSignalements, GetMySignalements, ById), `SignalementService`. Front : `nouveau-signalement`, `owner-signalements`, `syndic-signalements`, `signalement-list`.
**Enums** : statut EnCours / PrisEnCompte / Resolu ; type (7 valeurs) ; zone (11 valeurs).

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-SG-001 | Le propriétaire crée un signalement (type, zone, description, photo) | U,I,E | P2 | OWN | Statut `EnCours` ; syndic notifié ; présent dans `GetMySignalements` |
| COP-SG-002 | Champs obligatoires manquants | U,E | P2 | OWN | Validation |
| COP-SG-003 | Photo trop lourde ou dans un format interdit | U | P1 | OWN | Rejet (voir SEC-UPL) |
| COP-SG-004 | Le syndic passe le statut à `PrisEnCompte` puis `Resolu` | I,E | P2 | SYN | Statut mis à jour ; auteur notifié à chaque étape |
| COP-SG-005 | Un propriétaire modifie le statut | I | P1 | OWN | Refus |
| COP-SG-006 | `IncrementSignalementViews` appelé deux fois de suite par le même utilisateur | U,I | P3 | OWN | Compteur incrémenté selon la règle choisie (à chaque appel ou une fois par utilisateur) |
| COP-SG-007 | Supprimer le signalement d'un autre propriétaire | I | P1 | OWN | Refus |
| COP-SG-008 | `GetSyndicSignalements` | I | P1 | SYN | Uniquement les signalements de ses copropriétés |
| COP-SG-009 | Filtre par statut (`GetSignalementsByStatus`) | U,I | P3 | SYN | Résultat correct |
| COP-SG-010 | Chaque type × chaque zone | U | P3 | — | Sérialisation de l'enum et libellé traduit |
| COP-SG-011 | Écran « Nouveau signalement » et listes | E,V | P2 | OWN/SYN | Captures fr et ar |
