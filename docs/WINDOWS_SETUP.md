# Windows Setup Guide

This guide covers setting up Mnemosyne on Windows. There are two approaches:

1. **Docker Desktop** (GUI-based, recommended for beginners)
2. **Pure WSL** (More robust, runs entirely in Linux)

---

## Approach 1: Docker Desktop

Docker Desktop for Windows uses **WSL 2** (Windows Subsystem for Linux) as its backend. You must install WSL first.

### Step 1: Install WSL 2 (Required)

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

This installs WSL 2 with Ubuntu. **Restart your computer** when prompted.

### Step 2: Install Git & Docker Desktop

After restart, open **PowerShell as Administrator**:

```powershell
# Install Git
winget install Git.Git

# Install Docker Desktop
winget install Docker.DockerDesktop
```

**If Winget fails**, download manually:
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Git for Windows](https://git-scm.com/download/win)

### Step 3: Configure Docker Desktop

1. **Launch Docker Desktop** from the Start Menu
2. During first run, ensure **"Use WSL 2 based engine"** is checked (Settings → General)
3. Wait for Docker to finish starting (icon in system tray turns green)

### Step 4: Verify Installation

Open **PowerShell** and run:

```powershell
git --version
docker compose version
wsl --version
```

All three should show version numbers.

### Step 5: Clone & Setup Mnemosyne

```powershell
# Clone the repo to your home directory
cd ~
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne

# Run the setup script
.\setup.bat
```

Follow the prompts as detailed in the main [README](../README.md).

### Step 6: Start the Cluster

```powershell
docker compose up -d --build
```

---

## Troubleshooting

### "Docker Desktop requires WSL 2"

If you see this error:
1. Ensure you ran `wsl --install` and restarted
2. Check WSL is working: `wsl --status` 
3. If needed, update WSL: `wsl --update`

### "Virtualization not enabled"

WSL 2 requires hardware virtualization:
1. Restart into BIOS/UEFI (usually Delete or F2 during boot)
2. Enable **Intel VT-x** or **AMD-V** (setting varies by manufacturer)
3. Save and restart

### "Docker Desktop requires the Workstation service"

The Windows Workstation service is disabled:

```powershell
Set-Service LanmanWorkstation -StartupType Automatic
Start-Service LanmanWorkstation
```

Then restart Docker Desktop.

### WSL taking too much RAM

Create or edit `%USERPROFILE%\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=2
```

Then run `wsl --shutdown` and restart Docker.

---

## Approach 2: Pure WSL (Alternative)

If Docker Desktop causes issues, run Mnemosyne entirely inside WSL. This is more robust as it bypasses Docker Desktop's complexity.

### Step 1: Install WSL

```powershell
wsl --install
```

Restart when prompted.

### Step 2: Enter Ubuntu

Open **"Ubuntu"** from your Start Menu. Create a username/password when prompted.

### Step 3: Install Docker Engine

Inside the Ubuntu terminal:

```bash
# Remove any old Docker packages
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
    sudo apt-get remove -y $pkg 2>/dev/null
done

# Install Docker via official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Step 4: Install Tailscale (Required for WSL)

Since WSL is a separate "machine", it needs its own Tailscale connection:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Follow the link to authenticate.

### Step 5: Clone & Setup Mnemosyne

```bash
cd ~
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne
./setup.sh
```

### Step 6: Start the Cluster

```bash
docker compose up -d --build
```

---

## Mounting the Archive (Windows Explorer)

Once running, you can map the WebDAV share as a network drive:

1. Open **File Explorer** → **This PC**
2. Click **"Map network drive"** in the toolbar
3. **Drive**: Choose a letter (e.g., `Z:`)
4. **Folder**: `http://localhost:8080/archive`
5. Check **"Connect using different credentials"**
6. **Credentials**: Leave username/password blank (or use `admin`/blank)
7. Click **Finish**

The archive now appears as drive letter Z:.
