# Déboguer les services .NET dans Docker (local)

Les services `myb-notification` et `myb-coproperty` peuvent tourner dans Docker en **build Debug, avec le débogueur `vsdbg` intégré**. On attache ensuite VS Code ou Visual Studio au processus du conteneur : points d'arrêt, pas à pas, variables, exceptions.

Fichiers concernés :
- Les Dockerfiles des deux services ont une étape `debug`. Elle n'est construite que si on la demande ; l'image par défaut reste l'étape `final`, donc **la production ne change pas**.
- [docker-compose.debug.yml](../docker-compose.debug.yml) construit cette étape avec `BUILD_CONFIGURATION=Debug` et met des images taguées `:debug`.
- [.vscode/launch.json](../.vscode/launch.json) contient les configurations d'attach et [.vscode/tasks.json](../.vscode/tasks.json) les tâches pour démarrer et arrêter le backend.

## 1. Démarrer le backend en mode debug

```bash
bash scripts/push-local.sh up --debug
```

On peut aussi passer par VS Code : *Terminal → Run Task → Docker: backend debug*. C'est le même script que pour les tests push (Keycloak, comptes de test, VAPID), avec en plus les images Debug de `myb-notification` et `myb-coproperty`.

Pour revenir aux images normales :

```bash
bash scripts/push-local.sh up
```

## 2a. Attacher depuis VS Code

Il faut l'extension **C#** (`ms-dotnettools.csharp`).

1. Ouvrir le dossier racine du dépôt.
2. Aller dans **Run and Debug** (Ctrl+Shift+D) et choisir une configuration :
   - **Docker: attach notification**
   - **Docker: attach coproperty**
   - **Docker: attach notification + coproperty** pour les deux en même temps
3. Lancer avec F5, puis poser des points d'arrêt dans le code.
   - Exemple : [NotificationsController.cs](../src/services/notification-service/Myb.Notification/Controllers/NotificationsController.cs), méthode `Post`.
4. Déclencher la requête : depuis l'app, ou avec

   ```bash
   bash scripts/push-local.sh send owner "Test"
   ```

Comment ça marche : VS Code lance `docker compose exec -T <service> /vsdbg/vsdbg` et s'attache au PID 1, c'est-à-dire au processus `dotnet` du service. Les sources ont été compilées sous `/src` dans l'image ; `sourceFileMap` fait correspondre `/src` au dossier du dépôt.

## 2b. Attacher depuis Visual Studio

1. Aller dans **Debug → Attach to Process…** (Ctrl+Alt+P).
2. Dans **Connection type**, choisir **Docker (Linux Container)**. Dans **Connection target**, choisir `myb-myb-notification-1` ou `myb-myb-coproperty-1`.
3. Sélectionner le processus `dotnet`, avec le code type **Managed (.NET Core for Unix)**, puis cliquer sur **Attach**.

`myb-notification` cible .NET 10. Il faut une version de Visual Studio qui gère .NET 10 ; si les symboles ne se chargent pas, utiliser VS Code.

## Points d'attention

- **Point d'arrêt atteint = service figé.** Pendant qu'il est arrêté, le service ne répond plus. Le front ou `coproperty` peuvent tomber en timeout ; c'est normal. Les conteneurs debug ont `restart: "no"` pour ne pas être redémarrés pendant une pause.
- **Modifier le code = reconstruire.** Il n'y a pas de rechargement à chaud dans le conteneur. Après une modification, relancer `bash scripts/push-local.sh up --debug` : seules les images modifiées sont reconstruites.
- **Point d'arrêt « non vérifié ».** S'il reste creux (gris), vérifier que le conteneur tourne bien avec l'image `:debug` :

  ```bash
  docker inspect myb-myb-notification-1 --format '{{.Config.Image}}'
  ```
- **Lancer à la main depuis Git Bash.** Git Bash convertit `/vsdbg/vsdbg` en chemin Windows. Préfixer la commande par `MSYS_NO_PATHCONV=1`. VS Code et Visual Studio ne sont pas concernés.
- **Licence de `vsdbg`.** Ce débogueur n'est utilisable qu'avec des outils Microsoft (VS Code, Visual Studio) : au démarrage, il exige une vérification d'identité de l'IDE. Pour Rider, utiliser son propre débogueur distant.
- **Autres services.** Pour déboguer un autre service .NET, copier l'étape `debug` dans son Dockerfile, ajouter le service dans `docker-compose.debug.yml` et une configuration dans `.vscode/launch.json`.
