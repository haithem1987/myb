# OVH Credentials & Infrastructure Management

## 🔐 Getting OVH API Credentials

### Step 1: Log in to OVH Control Panel
- Go to [OVH API](https://api.ovh.com/createToken/)
- Or login to your OVH account → API → Application Keys

### Step 2: Create Application Credentials
When creating a new API token, set these permissions:

```
GET    /v1/cloud/*
POST   /v1/cloud/*
PUT    /v1/cloud/*
DELETE /v1/cloud/*
```

This will give you three credentials:
- **Application Key** → `OVH_APPLICATION_KEY`
- **Application Secret** → `OVH_APPLICATION_SECRET`
- **Consumer Key** → `OVH_CONSUMER_KEY`

### Step 3: Store Credentials Securely (Local Development)

**⚠️ NEVER commit credentials to git!** Choose ONE method below:

#### **Option A: Using `.env` file (Simplest)**

1. Create `.env` in project root:
   ```bash
   cat > .env << 'EOF'
   export OVH_APPLICATION_KEY="your-app-key-here"
   export OVH_APPLICATION_SECRET="your-app-secret-here"
   export OVH_CONSUMER_KEY="your-consumer-key-here"
   export OVH_ENDPOINT="ovh-eu"
   EOF
   ```

2. Add to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

3. Load before running scripts:
   ```bash
   source .env
   ./scripts/ovh-infra-status.sh prd
   ```

#### **Option B: Using `direnv` (Recommended 🌟)**

1. Install direnv:
   ```bash
   brew install direnv
   ```

2. Add to shell config (`.zshrc` or `.bashrc`):
   ```bash
   eval "$(direnv hook zsh)"
   # or
   eval "$(direnv hook bash)"
   ```

3. Create `.envrc` in project root:
   ```bash
   cat > .envrc << 'EOF'
   export OVH_APPLICATION_KEY="your-app-key-here"
   export OVH_APPLICATION_SECRET="your-app-secret-here"
   export OVH_CONSUMER_KEY="your-consumer-key-here"
   export OVH_ENDPOINT="ovh-eu"
   EOF
   ```

4. Add to `.gitignore`:
   ```bash
   echo ".envrc" >> .gitignore
   ```

5. Allow the directory:
   ```bash
   direnv allow
   ```

6. Credentials auto-load when you `cd` into project!

#### **Option C: Using macOS Keychain (Most Secure)**

```bash
# Store credentials in Keychain
security add-generic-password -a ovh_app_key -s OVH -w "your-app-key"
security add-generic-password -a ovh_app_secret -s OVH -w "your-app-secret"
security add-generic-password -a ovh_consumer_key -s OVH -w "your-consumer-key"

# Create retrieval script at ~/.config/ovh-creds.sh
mkdir -p ~/.config
cat > ~/.config/ovh-creds.sh << 'EOF'
#!/bin/bash
export OVH_APPLICATION_KEY=$(security find-generic-password -a ovh_app_key -s OVH -w)
export OVH_APPLICATION_SECRET=$(security find-generic-password -a ovh_app_secret -s OVH -w)
export OVH_CONSUMER_KEY=$(security find-generic-password -a ovh_consumer_key -s OVH -w)
export OVH_ENDPOINT="ovh-eu"
EOF
chmod +x ~/.config/ovh-creds.sh

# Load in shell config
echo "source ~/.config/ovh-creds.sh" >> ~/.zshrc
source ~/.zshrc
```

### Step 4: Verify Credentials
```bash
echo $OVH_APPLICATION_KEY
echo $OVH_APPLICATION_SECRET
echo $OVH_CONSUMER_KEY
```

If you see your credentials printed → ✓ **Setup successful!**

## � Security Best Practices

### ✅ DO:
- ✓ Use `.env` or `.envrc` for local development
- ✓ Add `.env` and `.envrc` to `.gitignore` (never commit credentials)
- ✓ Use different credentials per environment (dev/staging/prod)
- ✓ Rotate credentials periodically
- ✓ Use CI/CD secrets (see below) for automated deployments
- ✓ Limit API permissions to minimum required

### ❌ DON'T:
- ✗ Store credentials in `.zshrc` / `.bashrc` (gets committed in backups)
- ✗ Paste credentials in code, docs, or git history
- ✗ Share credentials via Slack, email, or unencrypted channels
- ✗ Use `eval` on untrusted scripts
- ✗ Leave credentials in terminal history

### 🚨 If Credentials Are Compromised:
1. **IMMEDIATELY** revoke in OVH console
2. Check OVH dashboard for unauthorized activity
3. Generate new credentials
4. Update all services using the old credentials

---

## 🚀 Production & CI/CD Deployment

### GitHub Actions (CI/CD Secrets)

If deploying via GitHub Actions, store credentials as **Repository Secrets**:

1. Go to: **Settings → Secrets and variables → Actions**
2. Add three secrets:
   - `OVH_APPLICATION_KEY`
   - `OVH_APPLICATION_SECRET`
   - `OVH_CONSUMER_KEY`

3. In your workflow `.github/workflows/deploy.yml`:
   ```yaml
   - name: Deploy Infrastructure
     env:
       OVH_APPLICATION_KEY: ${{ secrets.OVH_APPLICATION_KEY }}
       OVH_APPLICATION_SECRET: ${{ secrets.OVH_APPLICATION_SECRET }}
       OVH_CONSUMER_KEY: ${{ secrets.OVH_CONSUMER_KEY }}
       OVH_ENDPOINT: "ovh-eu"
     run: |
       ./scripts/ovh-infra-up.sh prd
   ```

### Railway / Other Deployment Platforms

Add to deployment environment variables:
- `OVH_APPLICATION_KEY=xxx`
- `OVH_APPLICATION_SECRET=xxx`
- `OVH_CONSUMER_KEY=xxx`
- `OVH_ENDPOINT=ovh-eu`

---

## �📋 Your Current Setup

### Clusters:
- **prd environment**: `myb-prd` (managed by Terraform)
- **hprd environment**: `myb-hprd` (deleted by user - now removed)
- **Default cluster**: `myb-coproperty-k8s` (kept by user - NOT managed by Terraform)

### Issue:
Your Terraform config manages `myb-prd` and `myb-hprd`, but you may be using `myb-coproperty-k8s` for actual workloads.

## ⚙️ Infrastructure Management

### Pause Infrastructure (Stop Costs)
```bash
./scripts/ovh-infra-down.sh prd --pause
```
- Scales nodes to 0
- Keeps cluster control plane alive
- Cheapest while preserving cluster state
- **Cost**: ~$5-10/month (control plane only)

### Resume Infrastructure (Bring Back Up)
```bash
./scripts/ovh-infra-up.sh prd
```
- Scales nodes back to default (2 for prd, 1 for hprd)
- Workloads will reschedule
- Takes ~2-3 minutes

### Full Destroy (Maximum Savings)
```bash
./scripts/ovh-infra-down.sh prd --destroy
```
- ⚠️ Removes entire cluster
- ⚠️ All local volume data lost
- **Cost**: $0/month
- Slow to restore (~10-15 minutes)

### Recreate After Destroy
```bash
./scripts/ovh-infra-up.sh prd
```

## 🔄 Workflow: Pause for Development

When developing locally or not using production:

```bash
# Pause when not in use
./scripts/ovh-infra-down.sh prd --pause

# Later, when ready to deploy/test
./scripts/ovh-infra-up.sh prd

# Check status (see terraform state)
cd terraform/ovh/environments/prd
terraform state list
terraform state show module.k8s_prd
```

## 💾 For Production Use

If you're actively using the cluster:

```bash
# Keep it running (nodes will stay provisioned)
# Check node status
kubectl get nodes

# Scale manually if needed
./scripts/ovh-infra-up.sh prd --nodes 4  # scale to 4 nodes
```

## ❓ Common Issues

### "Missing env var: OVH_APPLICATION_KEY"
→ You haven't exported credentials. See Step 3 above.

### "terraform not found"
→ Install Terraform: `brew install terraform`

### Cluster doesn't match what I see in OVH console
→ Check `terraform state list` to see what's managed by Terraform vs what's manual.

---

**Next Steps:**
1. Get OVH credentials from OVH console
2. Export them as environment variables
3. Run: `./scripts/ovh-infra-down.sh prd --pause`
