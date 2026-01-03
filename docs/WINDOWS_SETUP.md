# Windows Setup Guide

If you miss `apt install`, you'll love **Winget**. It is the official Windows Package Manager, pre-installed on modern Windows 10/11 versions.

## 1. Install Dependencies (The "Linux" Way)

Open **PowerShell** as Administrator and run:

```powershell
# 1. Install Git
winget install -e --id Git.Git

# 2. Install Docker Desktop
winget install -e --id Docker.DockerDesktop
```

**After installing:**
1.  **Restart** your terminal (to load the new PATH).
2.  Start **Docker Desktop** from the Start Menu.
3.  It may ask to install the **WSL 2 Kernel**. Follow the link it provides (or run `wsl --install` in PowerShell).

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
