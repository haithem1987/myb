# Oracle Cloud Deployment Guide for MYB

Complete guide for deploying MYB full-stack application on Oracle Cloud Free Tier.

---

## 🎯 Prerequisites

Before starting, ensure you have:

1. ✅ Oracle Cloud account (Free Tier)
2. ✅ SSH key pair generated on your local machine
3. ✅ Git repository with your code (GitHub/GitLab)
4. ✅ Domain name (optional, for production)

---

## 📋 Oracle Cloud Free Tier Resources

Your deployment will use:

- **Compute**: 1 Ampere A1 VM (4 cores, 24GB RAM) - **Recommended**
- **Storage**: 200GB block storage
- **Network**: 10TB outbound data transfer/month
- **IP**: 1 public IPv4 address

**Cost: $0/month (Always Free)**

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Oracle Cloud VM

#### 1.1 Create Compute Instance

1. Log in to [Oracle Cloud Console](https://cloud.oracle.com)
2. Navigate to: **Compute** → **Instances** → **Create Instance**

**Instance Configuration:**
```
Name: myb-production
Placement: Choose any AD
Image: Ubuntu 22.04 LTS (Canonical)
Shape: VM.Standard.A1.Flex (Ampere)
  - OCPUs: 4
  - Memory: 24 GB
Boot volume: 100 GB (increase if needed)
```

#### 1.2 Network Configuration

**Virtual Cloud Network:**
- Select: "Create new VCN"
- Name: myb-vcn
- CIDR: 10.0.0.0/16

**Subnet:**
- Select: "Create new subnet"
- Name: myb-subnet
- CIDR: 10.0.1.0/24
- Type: Public

**Public IP:** ✅ Assign a public IPv4 address

#### 1.3 Add SSH Keys

- Upload your public SSH key (`~/.ssh/id_rsa.pub`)
- Or paste the key content directly

#### 1.4 Create Instance

Click **Create** and wait ~2-3 minutes for provisioning.

---

### Step 2: Configure Security List (Firewall)

#### 2.1 Open Required Ports

Navigate to: **VCN** → **Security Lists** → **Default Security List**

**Add Ingress Rules:**

| Source CIDR | Protocol | Port Range | Description |
|-------------|----------|------------|-------------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 80 | HTTP |
| 0.0.0.0/0 | TCP | 443 | HTTPS |
| 0.0.0.0/0 | TCP | 4200 | Frontend |
| 0.0.0.0/0 | TCP | 8080 | Keycloak |
| 0.0.0.0/0 | TCP | 5001-5006 | Backend Services |

**Security Note:** For production, restrict source IPs and use HTTPS only.

---

### Step 3: Connect to VM

#### 3.1 Get Public IP

From the instance details page, copy the **Public IP Address**.

#### 3.2 SSH into VM

```bash
# On your local machine
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP
```

If you get a connection timeout, check:
- Security list ingress rules
- Ubuntu firewall (UFW)

---

### Step 4: Run Automated Setup

#### 4.1 Upload Setup Script

**Option A: Direct Download (if in repo)**
```bash
# On the VM
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/myb/main/scripts/deploy-oracle-cloud.sh
chmod +x deploy-oracle-cloud.sh
```

**Option B: Copy from Local Machine**
```bash
# On your local machine
scp -i ~/.ssh/id_rsa scripts/deploy-oracle-cloud.sh ubuntu@YOUR_PUBLIC_IP:~/
```

#### 4.2 Run Deployment Script

```bash
# On the VM
./deploy-oracle-cloud.sh
```

This script will:
- ✅ Update Ubuntu and install dependencies
- ✅ Install Docker and Docker Compose
- ✅ Install .NET 10 SDK
- ✅ Install Node.js 22 and Angular CLI
- ✅ Configure firewall (UFW)
- ✅ Clone your repository
- ✅ Generate `.env.production` with secure credentials

**Duration:** ~10-15 minutes

#### 4.3 Log Out and Back In

```bash
exit
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP
```

This activates Docker group permissions.

---

### Step 5: Configure Environment

#### 5.1 Review Generated Environment

```bash
cd ~/myb
cat .env.production
```

#### 5.2 Update Configuration (if needed)

```bash
nano .env.production
```

**Key settings to verify:**
```env
FRONTEND_URL=http://YOUR_PUBLIC_IP:4200
KEYCLOAK_URL=http://YOUR_PUBLIC_IP:8080

# These are auto-generated (keep them secure!)
KEYCLOAK_ADMIN_PASSWORD=<random>
DB_PASSWORD=<random>
JWT_SECRET=<random>
```

Save changes: `Ctrl+X`, `Y`, `Enter`

---

### Step 6: Build and Deploy

#### 6.1 Build Docker Images

```bash
./scripts/build-production.sh
```

This builds:
- ✅ All 4 backend services (.NET microservices)
- ✅ Frontend (Angular with Nginx)

**Duration:** ~15-20 minutes (first build)

#### 6.2 Start All Services

```bash
./scripts/start-production.sh
```

This starts:
- ✅ 4 PostgreSQL databases
- ✅ Keycloak (authentication)
- ✅ 4 backend microservices
- ✅ Frontend (Nginx serving Angular apps)

**Duration:** ~2-3 minutes

#### 6.3 Run Database Migrations

```bash
./scripts/run-migrations.sh
```

Creates all database tables and schema.

---

### Step 7: Verify Deployment

#### 7.1 Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show "healthy" status.

#### 7.2 Access Application

Open your browser:

**Frontend:**
```
http://YOUR_PUBLIC_IP:4200
```

**Keycloak Admin:**
```
http://YOUR_PUBLIC_IP:8080
Username: admin
Password: <from .env.production>
```

**GraphQL Endpoints:**
```
http://YOUR_PUBLIC_IP:5001/graphql  (UserService)
http://YOUR_PUBLIC_IP:5002/graphql  (DocumentService)
http://YOUR_PUBLIC_IP:5003/graphql  (InvoiceService)
http://YOUR_PUBLIC_IP:5004/graphql  (TimesheetService)
```

---

## 🔧 Common Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f user-service

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 invoice-service
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart user-service
```

### Stop Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Start Services (after stop)

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Rebuild After Code Changes

```bash
# Pull latest code
cd ~/myb
git pull origin main

# Rebuild specific service
docker compose -f docker-compose.prod.yml build user-service

# Restart service
docker compose -f docker-compose.prod.yml up -d user-service
```

### Database Backup

```bash
# Backup all databases
docker exec myb-postgres-user pg_dump -U myb_admin UserDB > userdb_backup.sql
docker exec myb-postgres-document pg_dump -U myb_admin DocumentDB > documentdb_backup.sql
docker exec myb-postgres-invoice pg_dump -U myb_admin InvoiceDB > invoicedb_backup.sql
docker exec myb-postgres-timesheet pg_dump -U myb_admin TimesheetDB > timesheetdb_backup.sql
```

### System Monitoring

```bash
# CPU and Memory usage
htop

# Docker stats
docker stats

# Disk usage
df -h

# Check free memory
free -h
```

---

## 🔒 Security Hardening (Production)

### 1. Enable HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 2. Configure Firewall

```bash
# Block all except necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Secure Environment Variables

```bash
# Restrict .env.production permissions
chmod 600 .env.production

# Never commit to Git
echo ".env.production" >> .gitignore
```

### 4. Enable Docker Container Restart Policies

Already configured in `docker-compose.prod.yml` with `restart: unless-stopped`

### 5. Regular Updates

```bash
# Create update script
cat > ~/update-system.sh << 'EOF'
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
docker system prune -af
EOF

chmod +x ~/update-system.sh

# Run monthly
./update-system.sh
```

---

## 📊 Resource Monitoring

### Check Resource Usage

```bash
# VM resources
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F% '{print $1}' 

echo "Memory Usage:"
free -m | awk 'NR==2{printf "Used: %s MB / Total: %s MB (%.2f%%)\n", $3,$2,$3*100/$2 }'

echo "Disk Usage:"
df -h | grep "/$" | awk '{print $3 " / " $2 " (" $5 ")"}'

# Docker container resources
docker stats --no-stream
```

### Set Up Alerts (Optional)

Use Oracle Cloud Monitoring or external services like:
- UptimeRobot (free tier)
- Healthchecks.io
- Better Uptime

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check if port is already in use
sudo netstat -tulpn | grep <port>

# Rebuild and restart
docker compose -f docker-compose.prod.yml build <service-name>
docker compose -f docker-compose.prod.yml up -d <service-name>
```

### Database Connection Issues

```bash
# Check database container
docker exec -it myb-postgres-user psql -U myb_admin -d UserDB

# Verify password in .env.production matches
cat .env.production | grep DB_PASSWORD
```

### Out of Memory

```bash
# Check memory usage
free -h

# Add swap space (if needed)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Keycloak Admin Password Lost

```bash
# Reset Keycloak admin password
docker exec -it myb-keycloak /opt/keycloak/bin/kc.sh admin set-password \
  --username admin --password NEW_PASSWORD
```

### Cannot Access from Browser

1. **Check Oracle Cloud Security List** (most common issue)
2. **Check UFW firewall:** `sudo ufw status`
3. **Check service is running:** `docker ps | grep myb`
4. **Check service logs:** `docker logs myb-frontend`

---

## 🚀 Performance Optimization

### 1. Enable Gzip Compression

Already configured in `nginx.prod.conf`

### 2. Configure Database Connection Pooling

Add to service environment variables:
```yaml
ConnectionStrings__DefaultConnection: Host=postgres;Port=5432;Database=DB;Username=user;Password=pass;Minimum Pool Size=5;Maximum Pool Size=100
```

### 3. Enable Docker BuildKit

```bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

### 4. Optimize Docker Images

- Use multi-stage builds (already configured)
- Minimize layers
- Use `.dockerignore` files

---

## 📈 Scaling (Future)

When you outgrow Free Tier:

### Vertical Scaling (Same VM)
- Upgrade to paid shape with more CPU/RAM
- Oracle Cloud charges: ~$0.01-0.03/hour

### Horizontal Scaling
- Add load balancer
- Multiple backend service instances
- Separate database server
- Use Oracle Container Engine for Kubernetes (OKE)

---

## 💡 Tips & Best Practices

1. **Backup regularly** - Automate database backups
2. **Monitor logs** - Set up centralized logging (ELK, Loki)
3. **Use domain name** - Better than IP addresses
4. **Enable HTTPS** - Always use SSL in production
5. **Update regularly** - Keep system and Docker images updated
6. **Document changes** - Keep deployment notes
7. **Test locally first** - Always test on dev before deploying

---

## 📞 Quick Commands Reference

```bash
# Start everything
./scripts/start-production.sh

# Stop everything
docker compose -f docker-compose.prod.yml down

# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f docker-compose.prod.yml restart user-service

# Check status
docker compose -f docker-compose.prod.yml ps

# Rebuild after code changes
git pull && ./scripts/build-production.sh && ./scripts/start-production.sh

# Database backup
docker exec myb-postgres-user pg_dump -U myb_admin UserDB > backup.sql

# System monitoring
htop
docker stats
```

---

## 🎓 Next Steps

1. **Set up domain name** and configure DNS
2. **Enable HTTPS** with Let's Encrypt
3. **Configure Keycloak** realm and clients
4. **Set up monitoring** and alerts
5. **Create backup automation**
6. **Document your specific configuration**

---

## 📚 Additional Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Docker Documentation](https://docs.docker.com/)
- [.NET Deployment Guide](https://docs.microsoft.com/en-us/dotnet/core/deploying/)
- [Angular Deployment](https://angular.io/guide/deployment)
- [Keycloak Documentation](https://www.keycloak.org/documentation)

---

**Deployment Status:** ✅ Production Ready

**Estimated Setup Time:** 45-60 minutes (first time)

**Monthly Cost:** $0 (Free Tier)

**Support:** Check project README and documentation
