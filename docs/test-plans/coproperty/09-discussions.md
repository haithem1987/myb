# Discussions et annonces

**Sources** : `DiscussionMutations` (CreateDiscussion, SendDiscussionMessage, ToggleDiscussionPin), `DiscussionQueries.GetDiscussions`, `Models/Discussion.cs` (Kind : Discussion / Announcement). Front : `discussions` (syndic et propriétaire).

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| COP-DC-001 | Créer une discussion avec un sujet | I,E | P2 | SYN/OWN | Discussion créée dans la copropriété |
| COP-DC-002 | Sujet vide ou fait d'espaces | U | P2 | — | « Le sujet est obligatoire. » |
| COP-DC-003 | Copropriété inexistante | U | P3 | — | « Copropriété introuvable. » |
| COP-DC-004 | Envoyer un message | I,E | P2 | OWN | Message ajouté ; texte nettoyé (`Trim`) ; rôle de l'auteur en minuscules |
| COP-DC-005 | Message vide | U | P2 | — | « Le message est vide. » |
| COP-DC-006 | Auteur absent | U | P2 | — | « L'auteur du message est obligatoire. » |
| COP-DC-007 | Discussion inexistante | U | P3 | — | « Discussion introuvable. » |
| COP-DC-008 | ⚠ Usurpation d'auteur : `AuthorId`/`AuthorRole` = « syndic » envoyés par un propriétaire | I | P1 | OWN | Attendu : l'auteur est déduit du jeton. **Risque** : l'auteur vient de l'input client, donc on peut écrire au nom de quelqu'un d'autre |
| COP-DC-009 | ⚠ `ToggleDiscussionPin` appelé par un propriétaire | I | P1 | OWN | Attendu : refus (réservé au syndic). **Risque** : aucun contrôle de rôle ni de copropriété |
| COP-DC-010 | Écrire dans une discussion d'une autre copropriété | I | P1 | OWN | Refus |
| COP-DC-011 | Une annonce (`Announcement`) n'accepte que les messages du syndic | I | P2 | OWN | Règle à confirmer et à tester |
| COP-DC-012 | Les discussions épinglées apparaissent en premier | U,V | P3 | — | Ordre correct ; capture |
| COP-DC-013 | Compteur de non-lus dans le menu (`GetSyndicMenuCounts`) | I | P3 | SYN | Cohérent |
