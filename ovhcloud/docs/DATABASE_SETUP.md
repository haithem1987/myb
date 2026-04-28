# OVHCloud Managed Databases Setup Guide

This guide explains how to set up PostgreSQL databases on OVHCloud for the MYB platform.

## Overview

The MYB platform requires the following databases:
1. **copropertyDB** - Coproperty management data
2. **invoiceDB** - Invoice and billing data
3. **keycloak** - Identity and access management

## Option 1: Using OVHCloud Public Cloud Databases (Recommended)

### Prerequisites
- OVHCloud account with Public Cloud project
- `ovhai` CLI tool installed (optional)
- Access to OVHCloud Control Panel

### Step-by-Step Setup

#### 1. Access Database Management

1. Log in to [OVHCloud Control Panel](https://www.ovh.com/manager/)
2. Navigate to **Public Cloud** → Your Project
3. Click on **Databases** in the left menu
4. Click **Create a database**

#### 2. Choose Database Configuration

**For Staging/Development:**
- **Engine**: PostgreSQL 16
- **Plan**: Essential (1-2 nodes, sufficient for dev/staging)
- **Region**: Choose closest to your Kubernetes cluster (e.g., GRA7, SBG5)
- **Node specifications**: 
  - 2 vCores
  - 4 GB RAM
  - 80 GB SSD

**For Production:**
- **Engine**: PostgreSQL 16
- **Plan**: Business or Enterprise (with backup & high availability)
- **Region**: Same as Kubernetes cluster
- **Node specifications**: 
  - 4+ vCores
  - 8+ GB RAM
  - 160+ GB SSD
- Enable **automatic backups** (daily recommended)
- Enable **IP restrictions** (whitelist your Kubernetes nodes)

#### 3. Create Database Instance

1. Name: `myb-postgres-staging` (or `myb-postgres-prod`)
2. Click **Create database**
3. Wait 5-10 minutes for provisioning

#### 4. Configure Databases

Once provisioned, you'll receive:
- **Hostname**: `postgresql-xxxxxx-yyyyyy.database.cloud.ovh.net`
- **Port**: `20184` (default for managed PostgreSQL)
- **Admin username**: `avnadmin`
- **Admin password**: (generated, shown once)

**Important**: Save these credentials securely!

#### 5. Create Application Databases

Connect to your PostgreSQL instance using `psql` or a GUI tool:

```bash
# Install PostgreSQL client if needed
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Ubuntu/Debian

# Connect to managed database
psql "postgresql://avnadmin:YOUR_PASSWORD@postgresql-xxxxxx.database.cloud.ovh.net:20184/defaultdb?sslmode=require"
```

Execute the following SQL:

```sql
-- Create databases
CREATE DATABASE "copropertyDB" ENCODING 'UTF8';
CREATE DATABASE "invoiceDB" ENCODING 'UTF8';
CREATE DATABASE "keycloak" ENCODING 'UTF8';

-- Create application users with strong passwords
CREATE USER coproperty_user WITH ENCRYPTED PASSWORD 'GENERATE_STRONG_PASSWORD_1';
CREATE USER invoice_user WITH ENCRYPTED PASSWORD 'GENERATE_STRONG_PASSWORD_2';
CREATE USER keycloak_user WITH ENCRYPTED PASSWORD 'GENERATE_STRONG_PASSWORD_3';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "copropertyDB" TO coproperty_user;
GRANT ALL PRIVILEGES ON DATABASE "invoiceDB" TO invoice_user;
GRANT ALL PRIVILEGES ON DATABASE "keycloak" TO keycloak_user;

-- Connect to each database and grant schema privileges
\c copropertyDB
GRANT ALL ON SCHEMA public TO coproperty_user;

\c invoiceDB
GRANT ALL ON SCHEMA public TO invoice_user;

\c keycloak
GRANT ALL ON SCHEMA public TO keycloak_user;
```

#### 6. Configure Network Access

In OVHCloud Control Panel:

1. Go to **Databases** → Your database → **Authorized IPs**
2. Add IP ranges:
   - Your Kubernetes cluster's node IPs
   - Your development machine IP (for testing)
   - Format: `203.0.113.0/24` or individual IPs

**Important**: For production, restrict to only Kubernetes nodes!

#### 7. Update Kubernetes Secrets

Edit `ovhcloud/k8s/secrets/database-secrets.yaml`:

```yaml
stringData:
  # Update with your actual values
  COPROPERTY_DB_HOST: "postgresql-xxxxxx.database.cloud.ovh.net"
  COPROPERTY_DB_PORT: "20184"
  COPROPERTY_DB_NAME: "copropertyDB"
  COPROPERTY_DB_USER: "coproperty_user"
  COPROPERTY_DB_PASSWORD: "your_generated_password_1"
  COPROPERTY_DB_CONNECTION_STRING: "Host=postgresql-xxxxxx.database.cloud.ovh.net;Port=20184;Database=copropertyDB;Username=coproperty_user;Password=your_generated_password_1;SSL Mode=Require"
  
  # Repeat for other databases...
```

#### 8. Enable SSL/TLS (Production)

OVHCloud managed databases enforce SSL by default. Ensure your connection strings include:
- `sslmode=require` (PostgreSQL clients)
- `SSL Mode=Require` (.NET connection strings)

Download CA certificate if needed:
```bash
wget https://ca-certificate-url-from-ovhcloud
```

## Option 2: Self-Hosted PostgreSQL in Kubernetes

If you prefer to manage PostgreSQL yourself:

### Using Bitnami PostgreSQL Helm Chart

```bash
# Add Bitnami repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL
helm install myb-postgres bitnami/postgresql \
  --namespace myb-platform \
  --set global.postgresql.auth.postgresPassword=ADMIN_PASSWORD \
  --set primary.persistence.size=50Gi \
  --set primary.resources.requests.memory=2Gi \
  --set primary.resources.requests.cpu=1000m
```

Then create databases using the SQL from Step 5 above.

## Backup & Disaster Recovery

### OVHCloud Managed Databases (Automatic)

- **Automatic backups**: Enabled by default (Business/Enterprise plans)
- **Retention**: 7-30 days (configurable)
- **Point-in-time recovery**: Available
- **Location**: Backups stored in OVHCloud object storage

### Manual Backups

```bash
# Create manual backup
pg_dump "postgresql://coproperty_user:PASSWORD@HOST:PORT/copropertyDB?sslmode=require" \
  --format=custom \
  --file=copropertyDB_backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore --dbname="postgresql://coproperty_user:PASSWORD@HOST:PORT/copropertyDB?sslmode=require" \
  --clean --if-exists \
  copropertyDB_backup_20260421.dump
```

## Monitoring & Alerts

In OVHCloud Control Panel:

1. Go to **Databases** → Your database → **Metrics**
2. Monitor:
   - CPU usage
   - Memory usage
   - Disk usage
   - Connection count
   - Query performance

Set up alerts:
- CPU > 80% for 5 minutes
- Disk usage > 85%
- Connection count > 90% of max

## Cost Estimation

**Staging (Essential plan):**
- 2 vCores, 4GB RAM, 80GB SSD
- ~€45-60/month per database instance
- Total for 1 instance with 3 databases: ~€45-60/month

**Production (Business plan):**
- 4 vCores, 8GB RAM, 160GB SSD + High Availability
- ~€180-250/month per database instance
- Total for 1 instance with 3 databases: ~€180-250/month

**Cost Optimization:**
- Use 1 PostgreSQL instance for all 3 databases (recommended)
- Use Essential plan for staging
- Enable auto-scaling only if needed

## Connection String Examples

**For ASP.NET Core:**
```
Host=postgresql-xxx.database.cloud.ovh.net;Port=20184;Database=copropertyDB;Username=coproperty_user;Password=xxx;SSL Mode=Require;Trust Server Certificate=true
```

**For psql:**
```
postgresql://coproperty_user:PASSWORD@postgresql-xxx.database.cloud.ovh.net:20184/copropertyDB?sslmode=require
```

## Troubleshooting

### Connection Refused
- Check IP allowlist in OVHCloud console
- Verify firewall rules on Kubernetes nodes
- Ensure SSL mode is enabled

### SSL Certificate Issues
- Download and install OVHCloud CA certificate
- Use `sslmode=require` instead of `verify-full` for testing

### Performance Issues
- Review slow query logs in OVHCloud metrics
- Consider upgrading plan
- Add indexes to frequently queried columns
- Enable connection pooling in your applications

## Security Best Practices

1. ✅ **Never commit secrets to Git** - Use Kubernetes secrets or external secret management
2. ✅ **Rotate passwords regularly** - Every 90 days minimum
3. ✅ **Use principle of least privilege** - Each service has its own database user
4. ✅ **Enable audit logging** - Track all database changes
5. ✅ **Restrict IP access** - Whitelist only necessary IPs
6. ✅ **Use SSL/TLS** - Always encrypt connections
7. ✅ **Regular backups** - Test restore procedures quarterly

## Next Steps

After database setup:
1. Update Kubernetes secrets with actual credentials
2. Test database connectivity from your local machine
3. Run database migrations for each service
4. Verify application connectivity
5. Set up monitoring and alerts

## References

- [OVHCloud Databases Documentation](https://docs.ovh.com/gb/en/publiccloud/databases/)
- [PostgreSQL SSL Documentation](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [Kubernetes Secrets Best Practices](https://kubernetes.io/docs/concepts/configuration/secret/)
