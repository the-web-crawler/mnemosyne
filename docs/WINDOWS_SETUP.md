# Windows Setup Guide

If you miss `apt install`, you'll love **Winget**. It is the official Windows Package Manager, pre-installed on modern Windows 10/11 versions.

## 1. Install Dependencies

### Option A: Via Winget (Command Line)
Open **PowerShell** as Administrator and run:
```powershell
winget install Git.Git
winget install Docker.DockerDesktop
```

### Option B: Manual Download (If Winget fails)
If PowerShell or Winget isn't working, simply download the installers:
1.  **Docker Desktop**: [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
2.  **Git**: [Download for Windows](https://git-scm.com/download/win)

Run both installers (Default settings are fine).

**After installing:**
1.  **Restart** your computer.
2.  Start **Docker Desktop** from the Start Menu.

## Troubleshooting

### "Docker Desktop requires the Workstation service"
This error means the Windows "Server" or "Workstation" service is disabled.
1.  Open **PowerShell** as Administrator.
2.  Run:
    ```powershell
    Set-Service LanmanWorkstation -StartupType Automatic
    Start-Service LanmanWorkstation
    ```
3.  Try starting Docker Desktop again.

## 2. Verify Installation

Run these commands in PowerShell to verify everything is ready:

```powershell
git --version
docker compose version
```

If you see version numbers, you are ready to proceed.

## 3. Clone & Setup

```powershell
# 1. Clone the repo
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne

# 2. Run the automated setup
.\setup.bat
```

Follow the on-screen prompts (as detailed in the main [README](../README.md)).

---

# Option 2: Pure WSL (Robust Alternative)

If Docker Desktop on Windows is giving you grief (Service errors, etc.), the most robust solution is to run Mnemosyne entirely inside **WSL 2** (Windows Subsystem for Linux).

## 1. Enable WSL
Open **PowerShell (Admin)** and run:
```powershell
wsl --install
```
*If installed, restart your computer.*

## 2. Enter Ubuntu
Open **"Ubuntu"** from your Start Menu. You will see a bash terminal.

## 3. Install Docker Engine (Native)
Run these commands inside the Ubuntu terminal:

```bash
# Remove conflicts
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Setup Mnemosyne (Inside WSL)
Now you clone the repo *inside* the Linux file system.

```bash
# Clone & Setup
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne
./setup.sh

# Start
docker compose up -d --build
```

## 5. Tailscale in WSL
Since this is a separate "machine", it needs its own Tailscale connection.
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
*Follow the link to auth.*
