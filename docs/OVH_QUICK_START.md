# OVH Infrastructure Quick Start

## ✅ What You Need

1. **OVH API Credentials** (from OVH Control Panel)
   ```bash
   export OVH_APPLICATION_KEY="xxx"
   export OVH_APPLICATION_SECRET="xxx"
   export OVH_CONSUMER_KEY="xxx"
   export OVH_ENDPOINT="ovh-eu"
   ```
   👉 **[Full Setup Guide](OVH_CREDENTIALS_SETUP.md)**

2. **Terraform** (already installed)
   ```bash
   terraform version
   ```

## 🚀 Quick Commands

### Check Status
```bash
./scripts/ovh-infra-status.sh prd
./scripts/ovh-infra-status.sh       # all environments
```

### Pause (💰 Cheapest - Keep Cluster)
```bash
./scripts/ovh-infra-down.sh prd --pause
# ✓ Nodes = 0 (stopped)
# ✓ Control plane stays alive
# ✓ Cost: ~$5-10/month
# ⏱  Restore time: ~1-2 min
```

### Resume
```bash
./scripts/ovh-infra-up.sh prd
# ✓ Scales back to 2 nodes (PRD default)
# ✓ Workloads reschedule automatically
# ⏱  Startup time: ~2-3 minutes
```

### Full Destroy (⚠️ Slowest but Cheapest)
```bash
./scripts/ovh-infra-down.sh prd --destroy
# ✗ Deletes entire cluster
# ✗ All local volume data lost
# ✓ Cost: $0/month
# ⏱  Restore time: ~10-15 minutes
```

## 📋 Recommended Workflow (Development)

**When not actively using production:**
```bash
# Before leaving for the day
./scripts/ovh-infra-down.sh prd --pause

# When you need it again
./scripts/ovh-infra-up.sh prd

# Check everything is good
./scripts/ovh-infra-status.sh prd
```

## 💾 What Gets Paused

- **Worker nodes** (b3-16 instances) → STOPPED ✓
- **Control plane** → Still running (minimal cost)
- **Cluster data** → Preserved
- **Persistent volumes** → Kept (but frozen)

## 🔄 What Happens to Workloads

When pausing:
1. Pods are evicted (graceful shutdown ~30s)
2. Services stop responding
3. Databases stop accepting connections

When resuming:
1. Control plane brings nodes back online (~2min)
2. Pods are rescheduled
3. Services resume

## ⚠️ Important Notes

- **Pause is reversible** → Resume anytime (fast)
- **Destroy is slower** → Only use if you won't need it soon
- **State is local** → Terraform state stored in `terraform/ovh/environments/prd/`
- **Credentials required** → Both down & up operations need OVH API access

## ❌ If You See Errors

### "Missing env var: OVH_APPLICATION_KEY"
→ You didn't export credentials. See Quick Commands section 1.

### "terraform not found"
→ Install: `brew install terraform`

### "Connection refused" or auth errors
→ Check credentials are correct (typos happen!)

---

**Next Step:** 
1. Get credentials from OVH console
2. Export them: `export OVH_APPLICATION_KEY="..."`
3. Try: `./scripts/ovh-infra-status.sh prd`
