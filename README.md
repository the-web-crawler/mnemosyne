# Mnemosyne: The Distributed Archive

**A self-healing, distributed digital vault for lifetime memories.**

> [!IMPORTANT]
> **Data Preservation First**: This system is designed for **Zero Data Loss**. 
> Please read the full [Architecture Specification](docs/ARCHITECTURE_SPEC.md) before making structural changes.

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
  - **Windows Users**: Read our [Windows Setup Guide](docs/WINDOWS_SETUP.md) (covers Winget & WSL).
- Tailscale (for mesh networking)

### 2. Setup
1. **Clone/Download** this repository to `~/mnemosyne` (or `C:\Mnemosyne` on Windows).
2. **Run Config Script**:
   We have automated scripts to generate secrets and configure keys.
   - **Linux / macOS**:
     ```bash
     chmod +x setup.sh
     ./setup.sh
     ```
   - **Windows**:
     - Double-click `setup.bat`.

   **The script will prompt you for:**
   - **`RPC_SECRET`**: Leave blank to generate. (Shared across cluster).
   - **`ADMIN_TOKEN`**: Leave blank to generate.
   - **`TS_AUTHKEY`**: [Generate here](https://login.tailscale.com/admin/settings/keys).
   - **`DATA_DIR`**: Location for Vault data.
   - **`TS_IP`**: The Tailscale IP of the current node (fixes connectivity).

3. **(Optional) Verify Config**:
   The script updates `.env` and `config.toml` automatically. You can check them if you wish.

4. **Start the Stack**:
   If you want to store the Vault data on an external hard drive:
   - Mount the drive (e.g., to `/mnt/ext_usb`).
   - Edit `.env` and set `DATA_DIR=/mnt/ext_usb/mnemosyne_data`.

4. **Start the Stack**:
   After running the setup script:
   ```bash
   docker compose up -d --build
   ```
   *Note: The `--build` flag ensures your local Dashboard is compiled from source.*

   **Access the Dashboard:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to view cluster status.

5. **Finalize Configuration**:
   - **Get your Container IP**:
     ```bash
     docker exec mnemosyne-net tailscale ip -4
     ```
   - **Update Config**: Edit `config.toml` and replace `100.x.y.z` with that IP.
   - **Apply**: `docker restart mnemosyne-store`

6. **Connect Nodes**:
   Run this **once** from any node to link them together:
   ```bash
   # Replace with the OTHER node's ID and IP
   docker exec -it mnemosyne-store /garage node connect <NODE_ID>@<NODE_IP>:3901
   ```
   *Tip: You must use the **Full Node ID**. Find it by running `docker exec mnemosyne-store /garage node id` on each machine.*

## Directory Structure

- `docker-compose.yml`: Defines the 4-container stack (Tailscale, Garage, Rclone, Dashboard).
- `config.toml`: Configuration for the Garage storage engine.
- `docs/ARCHITECTURE_SPEC.md`: **The Core Manual**. Contains the philosophy, detailed deployment steps, and recovery procedures. **Read this.**

## How It Works in Brief
- **Tailscale**: Connects all your devices into a private mesh.
- **Garage**: Distributes files across nodes (laptop, desktop, server) with redundancy.
- **Rclone**: Mounts the distributed storage as a local drive (`Z:` on Windows).

For full details on adding nodes, maintenance, and the "Arachnida Mesh" architecture, see the [Architecture Specification](docs/ARCHITECTURE_SPEC.md).

## Understanding Storage: Cache vs. Vault

It is critical to understand the difference between the two types of storage this system uses on your device.

### 1. The Cache (`CACHE_SIZE`)
- **What it is:** A temporary "viewing window" for files you access.
- **Where it lives:** Inside the container (mapped to `docker` storage).
- **Controlled by:** `.env` file (`CACHE_SIZE`).
- **Effect:** If you set this to `20G`, your laptop will keep the last 20GB of photos you viewed locally for fast access. If it fills up, old cached files are deleted. **NO DATA IS LOST.**

### 2. The Vault Contribution (`Garage Capacity`)
- **What it is:** Your device's permanent contribution to the Cluster.
- **Where it lives:** The `./data` folder in this directory.
- **Controlled by:** **Cluster Command** (see below).
- **Effect:** If you assign `50G` here, your laptop agrees to hold 50GB of encrypted, redundant chunks of the family archive. If you delete these files, **YOU DAMAGE THE ARCHIVE.**

### How to Set Vault Capacity
You cannot set the vault capacity in `.env` because it requires the whole cluster to agree. Run this **once** after the node joins:

```bash
# 1. Find your Node ID
docker exec mnemosyne-store /garage status

# 2. Assign Capacity (e.g., 50GB for this laptop)
# Replace <NODE_ID> with the ID from step 1
# Replace <ZONE> with your location tag (e.g., "dc1" or "home")
docker exec mnemosyne-store /garage layout assign -z <ZONE> -c 50G <NODE_ID>

# 3. Apply the Change
docker exec mnemosyne-store /garage layout apply --version 1
```

## Accessing Your Files (Mounting)

The "Synced Directory" is served via **WebDAV** on port **8080**. You must "Mount" or "Map" this to access it like a normal folder.

### 🪟 Windows (Map Network Drive)
1.  Open **File Explorer** -> **This PC**.
2.  Click **"Map network drive"** (in the top toolbar or right-click menu).
3.  **Drive**: Select a letter (e.g., `Z:`).
4.  **Folder**: `http://localhost:8080/archive`
5.  Check **"Connect using different credentials"**.
6.  Click **Finish**.
7.  **Credentials**: 
    -   **User**: `(Empty)` or `admin`
    -   **Password**: `(Empty)` (Authentication is handled via Tailscale IP allowlists).

### 🐧 Linux (Nautilus/Dolphin)
1.  Open your File Manager.
2.  Find **"Other Locations"** or **"Connect to Server"**.
3.  Enter Server Address: `dav://localhost:8080/archive`
4.  Click **Connect**.

### 💻 Linux (Command Line / Headless)
You can use `davfs2` to mount it as a system drive.
1.  **Install davfs2**: `sudo apt install davfs2` (Debian/Ubuntu)
2.  **Create Mount Point**: `sudo mkdir -p /mnt/mnemosyne`
3.  **Mount (with permissions)**:
    ```bash
    # Mounts with YOUR user as the owner so you can edit files
    sudo mount -t davfs -o uid=$(id -un),gid=$(id -gn) http://localhost:8080/archive /mnt/mnemosyne
    ```
    *Note: If prompted for credentials, press Enter (or use empty username/password).*

### 🍎 macOS (Finder)
1.  Open **Finder**.
2.  Press `Cmd + K` (Connect to Server).
3.  Server Address: `http://localhost:8080/archive`
4.  Click **Connect**.
