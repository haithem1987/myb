# MYB Daily Infrastructure Schedule

**Cost-saving automated up/down schedule for OVHcloud**

---

## Overview

This setup automates your infrastructure to scale down workloads every evening and scale back up every morning. This eliminates unnecessary compute costs while keeping your database and registry running.

### Cost Impact

| Component | Status | Cost |
|-----------|--------|------|
| Kubernetes compute (7 workloads) | **Stopped at night** | **€0** (saves ~€175/month) |
| PostgreSQL database | Running 24/7 | ~€50/month |
| Container registry | Running 24/7 | ~€10/month |
| **Total daily cost** | **~€2.19/day** | **(saves ~€5.83/day when scaled down)** |

---

## Supported Schedules

Choose one of these three methods:

### 1. GitHub Actions (Recommended)

**Pros:**
- No local machine required
- Runs reliably in the cloud
- Easy to monitor and debug
- Free for public repos, included in Actions quota

**Setup:**

1. **Create kubeconfig secret:**
   ```bash
   # Convert your kubeconfig to base64
   cat ovhcloud/kubeconfig-ebak4v.yml | base64 | pbcopy
   ```

2. **Add to GitHub repo secrets:**
   - Go to repo → Settings → Secrets and variables → Actions
   - Create new secret: `KUBECONFIG_BASE64` → paste the base64 string
   - Optional: `SLACK_WEBHOOK` for failure notifications

3. **Workflow already exists:**
   - File: `.github/workflows/daily-scale-schedule.yml`
   - Default schedule: **06:00 UTC (up)** and **18:00 UTC (down)**
   - Adjust times in the `cron` entries if needed

4. **Test it:**
   ```bash
   # Manual trigger in GitHub UI:
   # Actions tab → Daily Infrastructure Scale Schedule → Run workflow
   ```

---

### 2. Local Cron (macOS/Linux)

**Pros:**
- Runs on your machine
- No cloud dependency
- Simple to set up

**Setup:**

```bash
# Run the interactive setup
./ovhcloud/scripts/schedule-daily.sh

# Choose option 1 (Cron)
# Enter your preferred times (e.g., 18:00 and 06:00)
```

**Manual setup:**

```bash
# Edit crontab
crontab -e

# Add entries (example times):
0 18 * * * export KUBECONFIG="/Volumes/NidhalSSD/Projects/myb/ovhcloud/kubeconfig-ebak4v.yml" && bash /Volumes/NidhalSSD/Projects/myb/ovhcloud/scripts/scale-down.sh >> /tmp/myb-scale-down.log 2>&1

0 6 * * * export KUBECONFIG="/Volumes/NidhalSSD/Projects/myb/ovhcloud/kubeconfig-ebak4v.yml" && bash /Volumes/NidhalSSD/Projects/myb/ovhcloud/scripts/scale-up.sh >> /tmp/myb-scale-up.log 2>&1
```

**View logs:**
```bash
tail -f /tmp/myb-scale-down.log
tail -f /tmp/myb-scale-up.log
```

---

### 3. systemd Timer (Linux)

**Pros:**
- Runs on Linux servers
- Integrates with system logs
- No cron dependency

**Setup:**

```bash
# Run the interactive setup
./ovhcloud/scripts/schedule-daily.sh

# Choose option 2 (systemd timer)
# Enter your preferred times
```

**Check status:**

```bash
systemctl --user list-timers
systemctl --user status myb-scale-down.timer
systemctl --user status myb-scale-up.timer
```

**View logs:**

```bash
journalctl --user -u myb-scale-down.service -f
journalctl --user -u myb-scale-up.service -f
```

---

## Customizing Schedule Times

### GitHub Actions

Edit `.github/workflows/daily-scale-schedule.yml`:

```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # Change this to your DOWN time (UTC)
    - cron: '0 6 * * *'   # Change this to your UP time (UTC)
```

**Cron format:** `minute hour day month day-of-week`

Common times:
- `0 6 * * *` → 06:00 UTC (6 AM)
- `0 18 * * *` → 18:00 UTC (6 PM)
- `0 22 * * *` → 22:00 UTC (10 PM)
- `30 5 * * *` → 05:30 UTC (5:30 AM)

### Local Cron

Re-run the setup:
```bash
./ovhcloud/scripts/schedule-daily.sh
```

Or manually edit crontab:
```bash
crontab -e
```

---

## Manual Override

Run at any time to bypass schedule:

```bash
# Scale DOWN now (evening mode)
./ovhcloud/scripts/scale-down.sh

# Scale UP now (morning mode)
./ovhcloud/scripts/scale-up.sh
```

---

## What Happens During Scale Down

✅ **Scaled to 0 replicas:**
- myb-client (owner portal)
- myb-admin (syndic panel)
- myb-coproperty (backend API)
- myb-invoice (backend API)
- myb-mailer (notification service)
- keycloak (auth service)
- rabbitmq (message broker)

⏸️ **Still running (not scaled):**
- PostgreSQL managed database (€50/month)
- Container registry (€10/month)
- Kubernetes cluster nodes (minimal idle cost)

❌ **NOT running:**
- Any user-facing services
- Any API endpoints
- Any background jobs

---

## What Happens During Scale Up

✅ **Restored to 1 replica each:**
- All 7 services come back online
- Database connects successfully
- Ingress load balancer routes traffic
- Services become accessible within 60 seconds

---

## Monitoring & Alerts

### GitHub Actions

- View runs: https://github.com/YOUR_ORG/myb/actions/workflows/daily-scale-schedule.yml
- Logs available for each run
- Optional: Slack notifications on failure (requires `SLACK_WEBHOOK` secret)

### Local Cron

```bash
# Check if cron job ran
tail -20 /var/log/system.log | grep cron

# Or use the log files we created
tail -50 /tmp/myb-scale-down.log
tail -50 /tmp/myb-scale-up.log
```

### Manual verification

```bash
# Check current deployment replicas
kubectl get deployments -n myb-platform

# Expected during scale DOWN:
# NAME               DESIRED   CURRENT   READY   
# myb-client         0         0         0       
# myb-admin          0         0         0       
# myb-coproperty     0         0         0       

# Expected during scale UP:
# NAME               DESIRED   CURRENT   READY   
# myb-client         1         1         1       
# myb-admin          1         1         1       
# myb-coproperty     1         1         1       
```

---

## Troubleshooting

### Schedule isn't running

**GitHub Actions:**
- Check Actions tab for errors
- Verify kubeconfig secret is set
- Check cron time format

**Local Cron:**
```bash
# Verify cron is running
sudo launchctl list | grep cron  # macOS
sudo service cron status          # Linux

# Check crontab entry
crontab -l

# Test manually
bash /path/to/scale-down.sh
```

### Scale fails with kubectl error

```bash
# Check kubeconfig
echo $KUBECONFIG
kubectl cluster-info

# Verify namespace exists
kubectl get namespace myb-platform

# Check if deployments exist
kubectl get deployments -n myb-platform
```

### Deployments don't come back up

```bash
# Check pod status
kubectl get pods -n myb-platform

# View logs
kubectl logs -n myb-platform <pod-name>

# Describe pod for events
kubectl describe pod -n myb-platform <pod-name>
```

---

## Cost Savings Calculator

| Scenario | Daily Cost | Monthly Cost | Annual Savings |
|----------|-----------|-------------|----------------|
| **Always on** | €8.03 | €241 | — |
| **Scaled 12h/day** | €4.21 | €126 | **€1,380** |
| **Scaled 16h/day** (recommended) | €2.68 | €80 | **€1,932** |
| **Scaled 20h/day** | €1.61 | €48 | **€2,316** |

> *Calculations assume €175/month for Kubernetes compute.*

---

## Next Steps

1. **Choose your method:**
   - ☁️ GitHub Actions (easiest, recommended)
   - 💻 Local Cron
   - 🐧 systemd Timer

2. **Run setup:**
   ```bash
   ./ovhcloud/scripts/schedule-daily.sh
   ```
   OR follow manual instructions above.

3. **Test it:**
   - Manually run `scale-down.sh` → check replicas → run `scale-up.sh`
   - Monitor first scheduled run

4. **Adjust times as needed:**
   - Scale down when business hours end
   - Scale up before business hours start
   - Consider time zones for distributed teams

5. **Monitor costs:**
   - Check OVHcloud billing dashboard
   - Verify savings within first week

---

## Questions?

- **Logs:** Check GitHub Actions, cron logs, or systemd journal
- **Status:** Run `kubectl get deployments -n myb-platform`
- **Manual:** Anytime run `./ovhcloud/scripts/scale-down.sh` or `scale-up.sh`
