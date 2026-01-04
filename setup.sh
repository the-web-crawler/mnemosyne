#!/bin/bash

# Mnemosyne Setup Script
# Automates the configuration of secrets and environment variables.

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== Mnemosyne Setup ===${NC}"
echo "This script will generate secrets and configure your node."
echo ""

# 1. Check for Dependencies
if ! command -v openssl &> /dev/null; then
    echo -e "${YELLOW}Warning: openssl not found. You will need to manually enter secrets.${NC}"
fi

# 2. Variable Prompts

# RPC_SECRET
echo -e "${GREEN}[1/5] Cluster RPC Secret${NC}"
echo "This is the shared password for the entire cluster. All nodes must have the SAME secret."
read -p "Enter RPC_SECRET (leave blank to generate new one): " INPUT_RPC
if [ -z "$INPUT_RPC" ]; then
    RPC_SECRET=$(openssl rand -hex 32)
    echo -e "Generated: $RPC_SECRET"
else
    RPC_SECRET=$INPUT_RPC
fi
echo ""

# ADMIN_TOKEN
echo -e "${GREEN}[2/5] Admin Token${NC}"
echo "This is the password for the Web Dashboard."
read -p "Enter ADMIN_TOKEN (leave blank to generate new one): " INPUT_ADMIN
if [ -z "$INPUT_ADMIN" ]; then
    ADMIN_TOKEN=$(openssl rand -hex 32)
    echo -e "Generated: $ADMIN_TOKEN"
else
    ADMIN_TOKEN=$INPUT_ADMIN
fi
echo ""

# TS_HOSTNAME
CURRENT_HOST=$(hostname)
echo -e "${GREEN}[3/5] Tailscale Hostname${NC}"
echo "Unique name for this device in the cluster."
read -p "Enter TS_HOSTNAME (default: $CURRENT_HOST): " INPUT_HOST
if [ -z "$INPUT_HOST" ]; then
    TS_HOSTNAME=$CURRENT_HOST
else
    TS_HOSTNAME=$INPUT_HOST
fi
echo -e "Using: $TS_HOSTNAME"
echo ""

# TS_AUTHKEY
echo -e "${GREEN}[4/5] Tailscale Auth Key${NC}"
echo "Generate one here: https://login.tailscale.com/admin/settings/keys"
echo "Tip: Check 'Reusable' to use this key on all devices."
echo "Note: Keys expire. The Dashboard will warn you when your node disconnects."
read -p "Enter TS_AUTHKEY (required): " TS_AUTHKEY
if [ -z "$TS_AUTHKEY" ]; then
    echo -e "${YELLOW}Warning: No Auth Key provided. You will need to edit .env manually.${NC}"
fi
echo ""

# DATA_DIR
echo -e "${GREEN}[5/6] Data Directory${NC}"
echo "Where to store the Vault data? (Use '.' for internal drive)"
read -p "Enter DATA_DIR (default: ./data): " INPUT_DATA
if [ -z "$INPUT_DATA" ]; then
    DATA_DIR="./data"
else
    DATA_DIR=$INPUT_DATA
fi
echo ""

# S3_KEYS
echo -e "${GREEN}[6/6] Cluster S3 Credentials${NC}"
echo "Required for Rclone to sync files."
echo "- PRIMARY NODE: Leave blank (You will generate these later)."
echo "- SECONDARY NODE: Paste the keys from your primary node's .env file."
read -p "Enter S3_ACCESS_KEY_ID: " S3_ACCESS_KEY_ID
read -p "Enter S3_SECRET_ACCESS_KEY: " S3_SECRET_ACCESS_KEY
echo ""

# 3. Apply Configuration

echo -e "${CYAN}Applying configuration...${NC}"

# .env
if [ -f .env ]; then
    read -p ".env file already exists. Overwrite? (y/N) " OVERWRITE
    if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
        cp .env.example .env
    else
        echo "Skipping .env creation (preserving existing)."
    fi
else
    cp .env.example .env
fi

# Replace in .env
# We use a temp file to ensure cross-platform compatibility (sed -i differs on Mac/Linux)
sed "s|RPC_SECRET=.*|RPC_SECRET=$RPC_SECRET|g" .env > .env.tmp && mv .env.tmp .env
sed "s|ADMIN_TOKEN=.*|ADMIN_TOKEN=$ADMIN_TOKEN|g" .env > .env.tmp && mv .env.tmp .env
sed "s|TS_HOSTNAME=.*|TS_HOSTNAME=$TS_HOSTNAME|g" .env > .env.tmp && mv .env.tmp .env
sed "s|TS_AUTHKEY=.*|TS_AUTHKEY=$TS_AUTHKEY|g" .env > .env.tmp && mv .env.tmp .env
sed "s|DATA_DIR=.*|DATA_DIR=$DATA_DIR|g" .env > .env.tmp && mv .env.tmp .env
if [ ! -z "$S3_ACCESS_KEY_ID" ]; then
    sed "s|S3_ACCESS_KEY_ID=.*|S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID|g" .env > .env.tmp && mv .env.tmp .env
    sed "s|S3_SECRET_ACCESS_KEY=.*|S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY|g" .env > .env.tmp && mv .env.tmp .env
fi

echo -e "Updated ${GREEN}.env${NC}"

# config.toml
if [ -f config.toml ]; then
    echo "Skipping config.toml creation (preserving existing)."
else
    cp config.toml.example config.toml
fi

# Replace the placeholders
sed "s|replace_this_with_shared_32_byte_hex_secret|$RPC_SECRET|g" config.toml > config.toml.tmp && mv config.toml.tmp config.toml
sed "s|REPLACE_WITH_RPC_SECRET_FROM_ENV_FILE|$RPC_SECRET|g" config.toml > config.toml.tmp && mv config.toml.tmp config.toml
sed "s|REPLACE_WITH_ADMIN_TOKEN_FROM_ENV_FILE|$ADMIN_TOKEN|g" config.toml > config.toml.tmp && mv config.toml.tmp config.toml

echo -e "Updated ${GREEN}config.toml${NC}"

echo ""
echo -e "${GREEN}Setup Complete!${NC}"
echo "----------------------------------------------------"
echo "NEXT STEPS:"
echo "1. Start the stack:"
echo -e "   ${CYAN}docker compose up -d --build${NC}"
echo ""
echo "2. Finalize Configuration (REQUIRED):"
echo "   - Get your Tailscale IP: docker exec mnemosyne-net tailscale ip -4"
echo "   - Edit 'config.toml' and replace '100.x.y.z' with that IP."
echo "   - Restart: docker restart mnemosyne-store"
echo ""
echo "3. Connect Nodes (Run once per pair):"
echo "   - docker exec -it mnemosyne-store /garage node connect <OTHER_ID>@<OTHER_IP>:3901"
echo "----------------------------------------------------"
