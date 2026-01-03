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
