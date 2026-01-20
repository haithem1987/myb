# MYB Development Scripts

Automation scripts for faster development workflow.

## 🚀 Quick Start

### Local Frontend Development (Recommended)

Run frontend locally with hot reload, while backend services run in Docker:

```bash
# Start everything (backend in Docker + frontend locally)
./scripts/dev-local-frontend.sh client    # For client app
./scripts/dev-local-frontend.sh admin     # For admin app
```

**Benefits:**
- ⚡ Instant hot reload for frontend changes
- 🐳 Backend services in Docker (isolated)
- 💾 Faster development cycle
- 🔧 Easy debugging with browser DevTools

### Backend Only

Start only backend services (databases, APIs, Keycloak):

```bash
./scripts/dev-backend-only.sh
```

Then manually start frontend:
```bash
cd src/front/myb.front
npx nx serve client    # or admin
```

### Full Stack in Docker

Run everything in containers (slower but isolated):

```bash
docker compose up -d --build
```

## 📋 Available Scripts

### Development Workflow

| Script | Purpose | Usage |
|--------|---------|-------|
| `dev-local-frontend.sh` | Frontend locally + Backend in Docker | `./scripts/dev-local-frontend.sh [client\|admin]` |
| `dev-backend-only.sh` | Start only backend services | `./scripts/dev-backend-only.sh` |
| `dev-stop.sh` | Stop all Docker services | `./scripts/dev-stop.sh` |

## 🌐 Service Endpoints

### Frontend
- **Client App:** http://localhost:4200
- **Admin App:** http://localhost:4200

### Backend Services
- **Keycloak:** http://localhost:8080
- **User Manager:** http://localhost:8087
- **Timesheet:** http://localhost:8082
- **Document:** http://localhost:8086
- **Invoice:** http://localhost:8083
- **Payment:** http://localhost:8084
- **Notification:** http://localhost:8085
- **Coproperty:** http://localhost:8088

### Databases
- **Keycloak DB:** localhost:5450
- **Timesheet DB:** localhost:5448
- **Document DB:** localhost:5433
- **Invoice DB:** localhost:5434
- **Coproperty DB:** localhost:5435

## 💡 Development Tips

### Hot Reload for Frontend
When running frontend locally, changes are instantly reflected:
- Edit TypeScript/HTML/CSS → Saves automatically reload
- No need to rebuild Docker images
- Faster iteration cycles

### Backend Changes
Backend services run in Docker, so changes require rebuild:
```bash
# Rebuild specific service
docker compose -f docker-compose.dev.yml up -d --build myb-invoice

# Rebuild all backend
docker compose -f docker-compose.dev.yml up -d --build
```

### View Logs
```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f myb-invoice
docker compose -f docker-compose.dev.yml logs -f keycloak
```

### Check Service Status
```bash
docker compose -f docker-compose.dev.yml ps
```

### Clean Restart
```bash
# Stop everything
./scripts/dev-stop.sh

# Remove volumes (deletes data)
docker compose down -v

# Start fresh
./scripts/dev-backend-only.sh
```

## 🔧 Troubleshooting

### Frontend Can't Connect to Backend

Check environment configuration:
```typescript
// src/front/myb.front/apps/client/src/environments/environment.ts
export const environment = {
  services: {
    keycloak: { url: 'http://localhost:8080' },
    invoice: { baseUrl: 'http://localhost:8083' },
    // ... should point to localhost
  }
};
```

### Port Already in Use

Stop conflicting services:
```bash
# Check what's using port 4200
lsof -i :4200

# Kill process
kill -9 <PID>
```

### Docker Services Won't Start

Check logs:
```bash
docker compose -f docker-compose.dev.yml logs keycloak
docker compose -f docker-compose.dev.yml logs myb-invoice
```

Rebuild from scratch:
```bash
docker compose down -v
docker compose -f docker-compose.dev.yml up -d --build
```

## 📦 File Structure

```
scripts/
├── dev-local-frontend.sh    # Main development script
├── dev-backend-only.sh      # Backend services only
├── dev-stop.sh              # Stop all services
└── README.md                # This file

docker-compose.dev.yml       # Backend-only compose (no frontend)
docker-compose.yml           # Full stack compose
```

## 🎯 Recommended Workflow

1. **Start Development:**
   ```bash
   ./scripts/dev-local-frontend.sh client
   ```

2. **Make Frontend Changes:**
   - Edit files in `src/front/myb.front/apps/client/`
   - Changes hot reload automatically
   - Test at http://localhost:4200

3. **Make Backend Changes:**
   - Edit files in `src/services/`
   - Rebuild service: `docker compose -f docker-compose.dev.yml up -d --build myb-invoice`

4. **End of Day:**
   ```bash
   # Press Ctrl+C to stop frontend
   # Choose 'n' to keep backend running
   
   # Or stop everything
   ./scripts/dev-stop.sh
   ```

## 🚨 Common Issues

### "Module not found" in Frontend
```bash
cd src/front/myb.front
npm install
```

### Keycloak Not Starting
```bash
# Wait longer (can take 60s)
docker compose -f docker-compose.dev.yml logs -f keycloak

# Or restart
docker compose -f docker-compose.dev.yml restart keycloak
```

### Database Connection Errors
Check that databases are healthy:
```bash
docker compose -f docker-compose.dev.yml ps
# All should show "healthy" or "running"
```

---

**Happy coding! 🚀**

For more information, see the main project documentation in `/docs`.
