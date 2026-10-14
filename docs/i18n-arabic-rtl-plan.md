# Plan — Traduction FR/EN + Arabe (RTL)

Branche : `feature/i18n-arabic-rtl` (depuis `main`)
Périmètre : frontend Angular (`src/front/myb.front`, apps `client` et `admin`, libs partagées).

## 1. État des lieux (analyse du 14/10/2026)

| Élément | Constat |
|---|---|
| Librairie | `@ngx-translate/core` 15 + `TranslateHttpLoader` (`assets/i18n/{lang}.json`) |
| Fichiers | `apps/client/src/assets/i18n/{fr,en}.json` (~1 650 clés), `apps/admin/src/assets/i18n/{fr,en}.json` (~1 550 clés) |
| Parité FR/EN | client : 33 clés absentes en FR, 4 absentes en EN ; admin : 33 absentes en FR, 3 absentes en EN |
| Clés utilisées mais absentes | admin : 54 clés `HOME.*` (page d'accueil partagée) absentes de l'admin |
| Valeurs identiques FR/EN | ~85 par app (à revoir : vrais termes neutres vs oublis) |
| Valeurs incohérentes | ex. `HOME.FOOTER.COPYRIGHT` FR = « Manager Your Building », EN contient « Tantièmes » |
| Langues supportées | `['fr','en']` codé en dur dans `LanguageService`, `AppComponent` (client/admin), `KeycloakService` |
| Sélecteur | `<select>` avec English / Français uniquement |
| Direction | aucun `dir` ni `lang` mis à jour sur `<html>` ; `index.html` figé sur `lang="en"` |
| CSS | Bootstrap 5 compilé depuis SCSS (version LTR seulement) ; ~190 propriétés physiques (`margin-left`, `left:`, `text-align:right`…) dans les CSS/SCSS des composants ; ~560 utilitaires Bootstrap `ms-/me-/ps-/pe-/text-start/end` (corrects en sémantique mais compilés en physique dans le CSS LTR) |
| Police | Poppins (pas de glyphes arabes) |
| Formats | ~19 appels `toLocaleDateString('fr-FR')` / `Intl.NumberFormat('fr-FR')` codés en dur |
| Hors front | e-mails (mailer, Keycloak theme) gérés en FR/EN seulement côté backend |

## 2. Lots de travail

### Lot A — Outillage de vérification
- Script `scripts/check-translations.py` (existant, étendu) : parité des clés entre `fr/en/ar` pour chaque app, clés vides, clés utilisées dans le code mais absentes, valeurs FR=EN suspectes, script de caractères inattendu (latin dans `ar`, accents français dans `en`).
- Lancement : `python scripts/check-translations.py [--verbose]`.

### Lot B — Revue et correction FR / EN
1. Compléter les clés manquantes (FR et EN) dans les deux apps.
2. Ajouter à l'admin les clés `HOME.*` utilisées par la page d'accueil partagée.
3. Revue terminologique (copropriété / syndic) : cohérence des termes (tantièmes, appel de fonds, charges, signalement, résidence, lot/unité), ton (vouvoiement en FR), majuscules, ponctuation française (espace avant `:` `?` `!`), fautes.
4. Corriger les valeurs incohérentes (mauvaise langue, traduction littérale, texte copié non traduit).
5. Ne pas renommer les clés (risque de casse) sauf clé orpheline évidente.

### Lot C — Traduction arabe
- Créer `ar.json` pour `client` et `admin` avec la même structure que `fr.json`.
- Arabe standard moderne, terminologie de copropriété (اتحاد الملاك، الحصص (tantièmes)، نداء الأموال، الأعباء/الرسوم المشتركة، وحدة، إقامة، وكيل/سنديك).
- Conserver à l'identique les paramètres d'interpolation `{{ var }}`, les balises HTML et les noms de marque (MYB).

### Lot D — Infrastructure multilingue + RTL
1. Centraliser la liste des langues dans `LanguageService` (`fr`, `en`, `ar`) avec métadonnées : libellé natif, direction, locale `Intl` (`fr-FR`, `en-GB`, `ar-TN`).
2. À chaque changement de langue : mettre à jour `<html lang>` et `<html dir>` (+ classe `rtl` sur `body`).
3. Utiliser ces langues dans `AppComponent` (client/admin) et le sélecteur (`English`, `Français`, `العربية`).
4. `KeycloakService` : accepter `ar` côté app ; pour la synchronisation e-mails (backend FR/EN uniquement) envoyer le repli `fr` tant que les gabarits arabes n'existent pas.
5. Formats date/nombre : remplacer les locales codées en dur par la locale de la langue courante (helper partagé).

### Lot E — Styles RTL
1. Feuille globale `rtl.scss` (dans `custom-styles`) importée par les deux apps :
   - inversion des utilitaires Bootstrap compilés (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`, `float-start/end`, `start-0/end-0`, dropdowns, `form-select`, `input-group`, `btn-close`, listes) sous `[dir="rtl"]` via boucles SCSS sur `$spacers` ;
   - miroir des icônes directionnelles (flèches/chevrons Bootstrap Icons) ;
   - police arabe (Noto Sans Arabic / Cairo) pour `:lang(ar)`.
2. Composants : convertir les propriétés physiques en propriétés logiques (`margin-inline-start`, `padding-inline-end`, `border-inline-start`, `text-align: start/end`, `inset-inline-start`) — sans toucher aux centrages `left:50% + translateX(-50%)`.
3. Vérification ciblée des mises en page structurantes : sidebar/layout syndic et propriétaire, navbar, dropdowns utilisateur/notifications, modales, tableaux, page d'accueil.

### Lot F — Vérification
- `check-translations.py` sans erreur pour `fr`, `en`, `ar`.
- Build `nx build client` et `nx build admin`.
- Tests unitaires du `LanguageService` / sélecteur.
- Vérification visuelle dans le navigateur (FR, EN, AR) : pages publiques, connexion, tableau de bord, listes, modales — direction, alignements, icônes, débordements.

## 3. Hors périmètre (suivi proposé)
- Gabarits e-mails / thème Keycloak / notifications backend en arabe.
- Relecture de l'arabe par un locuteur natif métier (recommandée avant production).
- Textes en dur encore présents dans les templates (non passés par `translate`) : recensement fourni, migration progressive.

## 4. Ordre d'exécution
A → B → D → C → E → F (l'infrastructure D permet de tester l'arabe dès qu'il est ajouté).
