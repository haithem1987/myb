# Gestion documentaire (document-management)

**Sources** : `Myb.Document.Infra/GraqhQl/Mutations/DocumentMutation.cs` (Add/Update/Delete Document, Folder, DeleteFolderByParentId, Add/Update DocumentVersion, Add/Update/Delete RootFolder), `Queries/DocumentQuery.cs`, `Myb.Document.Services/*` (DocumentUploadService, DocumentVersionService, FolderService, RootFolderService). Front : `libs/doc-management-module` (folder-*, document-*, breadcumb, logs) ; copropriété : `documents` (propriétaire).
**Tests existants** : `unit-tests/security/DocumentUploadServiceTests.cs` + 23 specs dans `libs/doc-management-module`.

## DOC-RF — Dossiers racines et arborescence

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| DOC-RF-001 | `GetRootFolderByUserIdAndModuleName` à la première connexion | U,I | P2 | tous | Racine créée ou renvoyée ; une seule racine par utilisateur et par module |
| DOC-RF-002 | Créer des sous-dossiers sur 3 niveaux | U,I,E | P2 | tous | Fil d'Ariane correct (`breadcumb`, `FolderResolver`) |
| DOC-RF-003 | Renommer un dossier avec un nom déjà pris dans le même parent | U | P3 | tous | Refus, ou suffixe ajouté (règle à fixer) |
| DOC-RF-004 | Supprimer un dossier non vide / `DeleteFolderByParentId` | U,I | P1 | tous | Suppression récursive des documents et versions ; aucun fichier orphelin dans le stockage |
| DOC-RF-005 | Déplacer un dossier dans l'un de ses propres descendants | U | P2 | tous | Refus (cycle) |
| DOC-RF-006 | Accès au dossier d'un autre utilisateur par son id | I | P1 | autre | Refus |

## DOC-DC — Documents et versions

| ID | Scénario | Niv. | P | Rôle | Attendu |
|---|---|---|---|---|---|
| DOC-DC-001 | Téléverser un PDF valide | U,I,E | P1 | tous | Document et version 1 créés ; métadonnées (type, statut, taille) renseignées |
| DOC-DC-002 | Règles d'upload | U | P1 | — | Voir SEC-UPL-001 à 007 |
| DOC-DC-003 | Ajouter une nouvelle version | U,I | P2 | tous | Version n+1 ; la précédente reste consultable |
| DOC-DC-004 | Modifier le statut ou le type (`DocumentStatus`, `DocumentType`) | U | P3 | tous | Persisté |
| DOC-DC-005 | Supprimer un document | I | P2 | tous | Document, versions et fichier supprimés |
| DOC-DC-006 | Télécharger ou prévisualiser | E | P2 | tous | Contenu identique au fichier envoyé (comparaison de hash) |
| DOC-DC-007 | Documents de copropriété : le propriétaire ne voit que ceux de ses copropriétés | I,E | P1 | OWN | Isolation respectée |
| DOC-DC-008 | Écrans liste, détail, upload et journal | V | P3 | tous | Captures |
