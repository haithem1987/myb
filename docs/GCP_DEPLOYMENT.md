# Déploiement MYB Coproperty sur Google Cloud Platform

## Architecture déployée

```
┌─────────────────────────────────────────────────────────┐
│                  Google Cloud - Compute Engine VM        │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │myb-admin │  │ myb-coproperty│  │    keycloak       │  │
│  │  :4201   │  │  :8088       │  │    :8080          │  │
│  └──────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                       │                    │             │
│        ┌──────────────┼────────────────────┤             │
│        │              │                    │             │
│  ┌─────┴──────┐ ┌─────┴──────┐  ┌─────────┴──────────┐  │
│  │  rabbitmq  │ │copropertyDB│  │   keycloak-db      │  │
│  │  :15672    │ │ PostgreSQL │  │   PostgreSQL       │  │
│  └────────────┘ └────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Services déployés

| Service | Rôle | Port |
|---------|------|------|
| `myb-admin` | Frontend Angular (portails Syndic & Propriétaire) | 4201 |
| `myb-coproperty` | Backend .NET 8 (GraphQL API) | 8088 |
| `keycloak` | Serveur d'authentification | 8080 |
| `keycloak-db` | PostgreSQL pour Keycloak | interne |
| `copropertyDB` | PostgreSQL pour Coproperty | interne |
| `rabbitmq` | Message broker | 15672 (UI) |

## Prérequis

1. **Google Cloud SDK** installé et authentifié
2. **Docker** installé localement
3. Un **projet GCP** avec facturation activée

## Déploiement rapide (5 étapes)

### 1. Installer et configurer gcloud CLI

```bash
# macOS
brew install --cask google-cloud-sdk

# Se connecter
gcloud auth login
gcloud auth application-default login
```

### 2. Configurer les variables d'environnement

```bash
cp .env.gcp.example .env.gcp
```

Éditez `.env.gcp` et remplissez **obligatoirement** :

| Variable | Description |
|----------|-------------|
| `GCP_PROJECT_ID` | ID de votre projet GCP |
| `GCP_REGION` | Région (ex: `europe-west1`) |
| `KEYCLOAK_ADMIN_PASSWORD` | Mot de passe admin Keycloak |
| `KEYCLOAK_DB_PASSWORD` | Mot de passe BDD Keycloak |
| `COPROPERTY_DB_PASSWORD` | Mot de passe BDD Coproperty |
| `KEYCLOAK_CLIENT_SECRET` | Secret OAuth Keycloak |
| `KEYCLOAK_SERVICE_CLIENT_SECRET` | Secret client service |
| `RABBITMQ_PASSWORD` | Mot de passe RabbitMQ |

### 3. Déploiement complet (une seule commande)

```bash
./scripts/deploy-gcp.sh full
```

Cette commande exécute dans l'ordre :
1. Configuration du projet GCP
2. Activation des APIs nécessaires
3. Création du registre Artifact Registry
4. Build & push des images Docker
5. Création des règles de pare-feu
6. Création de la VM Compute Engine
7. Déploiement des services sur la VM

### 4. Vérifier le déploiement

```bash
./scripts/deploy-gcp.sh status
```

### 5. Configurer Keycloak

Accédez à `http://<VM_IP>:8080` et configurez :
- Créer le realm `MYB`
- Créer le client `MYB-client`
- Configurer les rôles et utilisateurs

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `./scripts/deploy-gcp.sh setup` | Configure GCP, active APIs, crée Artifact Registry |
| `./scripts/deploy-gcp.sh build` | Build et push des images Docker |
| `./scripts/deploy-gcp.sh create-vm` | Crée la VM et les règles de pare-feu |
| `./scripts/deploy-gcp.sh deploy` | Déploie les services sur la VM |
| `./scripts/deploy-gcp.sh full` | Exécute tout le processus |
| `./scripts/deploy-gcp.sh status` | Affiche l'état des services |
| `./scripts/deploy-gcp.sh logs` | Stream les logs en temps réel |
| `./scripts/deploy-gcp.sh destroy` | Supprime la VM (DESTRUCTIF) |

## Après un changement de code

```bash
# Rebuild et redéployer
./scripts/deploy-gcp.sh build
./scripts/deploy-gcp.sh deploy
```

## Accès aux services

| Service | URL | Identifiants par défaut |
|---------|-----|------------------------|
| Admin (Syndic/Owner) | `http://<VM_IP>:4201` | Keycloak login |
| API Coproperty | `http://<VM_IP>:8088/graphql` | Token Keycloak |
| Keycloak | `http://<VM_IP>:8080` | admin / (votre mot de passe) |
| RabbitMQ | `http://<VM_IP>:15672` | (votre config) |

## SSH dans la VM

```bash
gcloud compute ssh myb-coproperty-vm --zone=europe-west1-b
```

## Voir les logs d'un service spécifique

```bash
gcloud compute ssh myb-coproperty-vm --zone=europe-west1-b --command="
  cd ~/myb-deploy && docker compose -f docker-compose.gcp.yml logs -f myb-coproperty
"
```

## Coûts estimés (GCP)

| Ressource | Type | Coût mensuel estimé |
|-----------|------|-------------------|
| VM Compute Engine | e2-medium (2 vCPU, 4GB) | ~$25/mois |
| Disque | 30GB pd-balanced | ~$3/mois |
| Artifact Registry | Stockage images | ~$1/mois |
| **Total** | | **~$29/mois** |

> Pour réduire les coûts, vous pouvez utiliser une VM `e2-small` (2 vCPU, 2GB) à ~$13/mois si le trafic est faible.

## Upgrade vers une architecture production

Pour un déploiement production robuste, considérez :

1. **Cloud SQL** au lieu de PostgreSQL en conteneur (backups automatiques, HA)
2. **Cloud Run** pour les services stateless (myb-coproperty, myb-front)
3. **Cloud Load Balancer** + certificat SSL
4. **Secret Manager** pour les secrets
5. **Cloud Armor** pour la protection DDoS
6. **Cloud CDN** pour le frontend

## Dépannage

### Les services ne démarrent pas
```bash
# Vérifier les logs
./scripts/deploy-gcp.sh logs

# SSH et vérifier manuellement
gcloud compute ssh myb-coproperty-vm --zone=europe-west1-b
cd ~/myb-deploy
docker compose -f docker-compose.gcp.yml ps
docker compose -f docker-compose.gcp.yml logs keycloak
```

### Keycloak ne démarre pas
Keycloak a besoin de ~60s pour démarrer. Vérifiez :
```bash
docker compose -f docker-compose.gcp.yml logs keycloak-db  # DB doit être ready
docker compose -f docker-compose.gcp.yml logs keycloak     # Vérifier les erreurs
```

### Problème de connexion à la BDD
Vérifiez que les mots de passe dans `.env.gcp` correspondent et que les conteneurs DB sont healthy :
```bash
docker compose -f docker-compose.gcp.yml ps
```
