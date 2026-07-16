#!/bin/bash
# Install daily up/down schedule using cron or systemd
# This script sets up automatic scaling based on your preferred schedule

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MYB Platform - Daily Schedule Setup${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}Choose your scheduling method:${NC}"
echo "1. Cron (runs on this machine)"
echo "2. systemd timer (Linux only)"
echo "3. Show manual setup instructions"
echo "4. Exit"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Setting up cron jobs...${NC}"
        
        # Get schedule times from user
        read -p "Scale DOWN time (24h format, e.g., 18:00): " down_time
        read -p "Scale UP time (24h format, e.g., 06:00): " up_time
        
        # Parse times
        down_hour=$(echo "$down_time" | cut -d: -f1)
        down_min=$(echo "$down_time" | cut -d: -f2)
        up_hour=$(echo "$up_time" | cut -d: -f1)
        up_min=$(echo "$up_time" | cut -d: -f2)
        
        # Create cron entries
        crontab_entry="$down_min $down_hour * * * export KUBECONFIG=\"$PROJECT_ROOT/ovhcloud/kubeconfig-*.yml\" && bash $SCRIPT_DIR/scale-down.sh >> /tmp/myb-scale-down.log 2>&1
$up_min $up_hour * * * export KUBECONFIG=\"$PROJECT_ROOT/ovhcloud/kubeconfig-*.yml\" && bash $SCRIPT_DIR/scale-up.sh >> /tmp/myb-scale-up.log 2>&1"
        
        # Add to crontab
        (crontab -l 2>/dev/null | grep -v "scale-down\|scale-up" || true; echo "$crontab_entry") | crontab -
        
        echo -e "\n${GREEN}✓ Cron jobs installed!${NC}"
        echo -e "\n${BLUE}Schedule:${NC}"
        echo -e "  Scale DOWN: $down_time daily"
        echo -e "  Scale UP:   $up_time daily"
        echo -e "\n${BLUE}Logs:${NC}"
        echo -e "  Scale DOWN: /tmp/myb-scale-down.log"
        echo -e "  Scale UP:   /tmp/myb-scale-up.log"
        echo -e "\n${YELLOW}View crontab:${NC}"
        echo -e "  crontab -l"
        ;;
        
    2)
        echo -e "\n${YELLOW}Setting up systemd timer...${NC}"
        
        read -p "Scale DOWN time (24h format, e.g., 18:00): " down_time
        read -p "Scale UP time (24h format, e.g., 06:00): " up_time
        
        # Create systemd service files
        SYSTEMD_DIR="$HOME/.config/systemd/user"
        mkdir -p "$SYSTEMD_DIR"
        
        # Scale down service
        cat > "$SYSTEMD_DIR/myb-scale-down.service" <<EOF
[Unit]
Description=MYB Platform - Scale Down (Evening)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=bash $SCRIPT_DIR/scale-down.sh
StandardOutput=journal
StandardError=journal
EOF
        
        # Scale up service
        cat > "$SYSTEMD_DIR/myb-scale-up.service" <<EOF
[Unit]
Description=MYB Platform - Scale Up (Morning)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=bash $SCRIPT_DIR/scale-up.sh
StandardOutput=journal
StandardError=journal
EOF
        
        # Scale down timer
        cat > "$SYSTEMD_DIR/myb-scale-down.timer" <<EOF
[Unit]
Description=MYB Platform - Scale Down Timer

[Timer]
OnCalendar=*-*-* $down_time:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
        
        # Scale up timer
        cat > "$SYSTEMD_DIR/myb-scale-up.timer" <<EOF
[Unit]
Description=MYB Platform - Scale Up Timer

[Timer]
OnCalendar=*-*-* $up_time:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
        
        # Enable and start timers
        systemctl --user daemon-reload
        systemctl --user enable myb-scale-down.timer myb-scale-up.timer
        systemctl --user start myb-scale-down.timer myb-scale-up.timer
        
        echo -e "\n${GREEN}✓ systemd timers installed!${NC}"
        echo -e "\n${BLUE}Schedule:${NC}"
        echo -e "  Scale DOWN: $down_time daily"
        echo -e "  Scale UP:   $up_time daily"
        echo -e "\n${YELLOW}Check status:${NC}"
        echo -e "  systemctl --user status myb-scale-down.timer"
        echo -e "  systemctl --user status myb-scale-up.timer"
        echo -e "\n${YELLOW}View logs:${NC}"
        echo -e "  journalctl --user -u myb-scale-down.service -f"
        echo -e "  journalctl --user -u myb-scale-up.service -f"
        ;;
        
    3)
        echo -e "\n${BLUE}========================================${NC}"
        echo -e "${BLUE}Manual Schedule Setup${NC}"
        echo -e "${BLUE}========================================${NC}"
        
        echo -e "\n${YELLOW}Option A: macOS (launchd)${NC}"
        echo -e "Create ~/Library/LaunchAgents/com.myb.scale-down.plist"
        echo -e "and com.myb.scale-up.plist with appropriate RunAtLoad times"
        
        echo -e "\n${YELLOW}Option B: GitHub Actions (Recommended)${NC}"
        echo -e "Create .github/workflows/daily-scale.yml to run via GitHub"
        echo -e "Example: scale down at 18:00 UTC, up at 06:00 UTC"
        
        echo -e "\n${YELLOW}Option C: Manual commands${NC}"
        echo -e "Scale DOWN (evening):   $SCRIPT_DIR/scale-down.sh"
        echo -e "Scale UP (morning):     $SCRIPT_DIR/scale-up.sh"
        ;;
        
    4)
        echo -e "${YELLOW}Exiting...${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${YELLOW}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"
