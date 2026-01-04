# Windows Setup Guide

The recommended approach for Windows is to use **WSL 2** (Windows Subsystem for Linux) and follow the standard Linux setup inside it.

## Step 1: Install WSL

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

Restart your computer when prompted.

## Step 2: Enter Ubuntu

After restart, open **"Ubuntu"** from the Start Menu. Create a username and password when prompted.

## Step 3: Follow Linux Setup

From here, follow the exact same steps as Linux. Inside the Ubuntu terminal:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Tailscale (WSL needs its own connection)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Follow the link to authenticate

# Clone and setup Mnemosyne
cd ~
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne
./setup.sh

# Start the cluster
docker compose up -d --build
```

## Step 4: Join the Cluster

After the containers start, an existing node needs to add this one to the layout:

```bash
# On an EXISTING node (not this one), run:
docker exec mnemosyne-store /garage layout assign -z dc1 -c 10G <NEW_NODE_ID>
docker exec mnemosyne-store /garage layout apply --version <NEXT_VERSION>
```

Get the node ID from: `docker exec mnemosyne-store /garage node id -q`

---

## Mounting the Archive (Optional)

To access files via Windows Explorer, mount the WebDAV share:

1. Open **File Explorer** → **This PC**
2. Click **"Map network drive"**
3. **Folder**: `http://localhost:8080/archive`
4. Leave credentials blank

---

## Troubleshooting

### WSL won't install
- Ensure virtualization is enabled in BIOS (Intel VT-x or AMD-V)
- Check Windows version: WSL 2 requires Windows 10 version 2004+ or Windows 11

### Docker command not found
- Make sure you ran `newgrp docker` after `usermod`
- Or log out and back in to the Ubuntu terminal

### Rclone can't list files
- Check that `.env` has the correct `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`
- These must match another node's `.env` values
- Restart Rclone after fixing: `docker restart mnemosyne-mount`
