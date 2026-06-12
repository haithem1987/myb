# OVH Credentials Setup - Quick Reference

## 🚀 TL;DR (30 seconds)

### Step 1: Get Credentials
→ Go to https://api.ovh.com/createToken/ and create new credentials

### Step 2: Run Setup Wizard
```bash
./scripts/setup-ovh-credentials.sh
```

Choose method when prompted:
- `env` - Simple (stores in `.env` file)
- `envrc` - **RECOMMENDED** (auto-loads with direnv)
- `keychain` - Secure (macOS Keychain)

### Step 3: Test
```bash
./scripts/ovh-infra-status.sh prd
```

✓ Done!

---

## 📋 Detailed Steps

### 1️⃣ Get OVH API Credentials (2 min)

**Option A: OVH API Console (Recommended)**
- Visit: https://api.ovh.com/createToken/
- Create new token with cloud permissions
- You'll get 3 credentials:
  - Application Key
  - Application Secret
  - Consumer Key

**Option B: Through OVH Account**
- Log in to: https://www.ovh.com/manager/
- API → Application Keys → Create
- Same result as Option A

### 2️⃣ Store Credentials

**Automated (Recommended):**
```bash
./scripts/setup-ovh-credentials.sh
```
This guides you through all options.

**Manual - Option A: .env file**
```bash
cat > .env << 'EOF'
export OVH_APPLICATION_KEY="your-key"
export OVH_APPLICATION_SECRET="your-secret"
export OVH_CONSUMER_KEY="your-consumer"
export OVH_ENDPOINT="ovh-eu"
EOF

# Then load:
source .env
```

**Manual - Option B: .envrc (recommended)**
```bash
# Install direnv first
brew install direnv

# Add to ~/.zshrc or ~/.bashrc
eval "$(direnv hook zsh)"

# Create .envrc
cat > .envrc << 'EOF'
export OVH_APPLICATION_KEY="your-key"
export OVH_APPLICATION_SECRET="your-secret"
export OVH_CONSUMER_KEY="your-consumer"
export OVH_ENDPOINT="ovh-eu"
EOF

# Allow it
direnv allow

# Auto-loads when you cd into project!
```

### 3️⃣ Verify Setup

```bash
# Test credentials
./scripts/ovh-infra-status.sh prd

# You should see cluster status
```

---

## 🎯 Recommended Workflow

**When setting up for the first time:**
```bash
./scripts/setup-ovh-credentials.sh
# Choose: envrc (requires: brew install direnv)
```

**Daily usage:**
```bash
# Credentials auto-load when you cd into project

# Check status
./scripts/ovh-infra-status.sh prd

# Pause before leaving
./scripts/ovh-infra-down.sh prd --pause

# Resume when needed
./scripts/ovh-infra-up.sh prd
```

---

## 🔐 Security Checklist

- [ ] Never commit `.env` or `.envrc` files
- [ ] Both are in `.gitignore` (already configured)
- [ ] Credentials are for API access only (limited scope)
- [ ] If compromised, revoke immediately in OVH console
- [ ] Use different credentials for dev/staging/prod if possible

---

## ❓ Troubleshooting

### "Missing env var: OVH_APPLICATION_KEY"
→ You haven't loaded credentials yet
```bash
source .env  # if using .env method
# or
direnv allow  # if using .envrc method
```

### "direnv not found"
→ Install it: `brew install direnv`

### "Credentials won't load"
→ Check file permissions:
```bash
ls -lh .env
# Should show: -rw------- (600 permissions)
```

### "terraform not found"
→ Install: `brew install terraform`

---

## 📚 Full Documentation

- **[OVH_CREDENTIALS_SETUP.md](OVH_CREDENTIALS_SETUP.md)** - Complete setup guide
- **[OVH_QUICK_START.md](OVH_QUICK_START.md)** - Daily operations reference

---

## 🚀 Ready? Start here:

```bash
./scripts/setup-ovh-credentials.sh
```

Then:

```bash
./scripts/ovh-infra-status.sh prd
./scripts/ovh-infra-down.sh prd --pause   # Pause costs
./scripts/ovh-infra-up.sh prd              # Resume
```
