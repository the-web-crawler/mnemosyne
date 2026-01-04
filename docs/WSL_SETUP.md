# Running in Pure WSL (The "Robust" Way)

If Docker Desktop on Windows is giving you grief (Service errors, etc.), the most robust solution is to run Mnemosyne entirely inside **WSL 2** (Windows Subsystem for Linux).

This effectively gives you a real Linux environment inside Windows, bypassing the Windows Service dependnecy hell.

## 1. Enable WSL
Open **PowerShell (Admin)** and run:
```powershell
wsl --install
```
*If installed, restart your computer.*

## 2. Enter Ubuntu
Open **"Ubuntu"** from your Start Menu. You will see a bash terminal.

## 3. Install Docker Engine (Native)
Run these commands inside the Ubuntu terminal to install Docker directly:

```bash
# 1. Remove conflicting packages
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done

# 2. Install Docker using the convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Add yourself to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Setup Mnemosyne (Inside WSL)
Now you clone the repo *inside* the Linux file system (it's faster and safer).

```bash
# 1. Clone
git clone https://github.com/the-web-crawler/mnemosyne.git
cd mnemosyne

# 2. Run Setup
./setup.sh
# (Follow prompts. It works exactly like the Linux machine now)

# 3. Start
docker compose up -d --build
```

## 5. Tailscale in WSL
Since this is a separate "machine", it needs its own Tailscale connection.
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
*Follow the link to auth.*

## Benefits
-   **No "Workstation Service" errors.**
-   **Native Performance**: Filesystem operations are much faster.
-   **Standardization**: You are now running Linux instructions on both peers.
