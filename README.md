# Mnemosyne: The Distributed Archive

**A self-healing, distributed digital vault for lifetime memories.**

> [!IMPORTANT]
> **Data Preservation First**: This system is designed for **Zero Data Loss**. 
> Please read the full [Architecture Specification](docs/ARCHITECTURE_SPEC.md) before making structural changes.

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Tailscale (for mesh networking)

### 2. Setup
1. **Clone/Download** this repository to `~/mnemosyne` (or `C:\Mnemosyne` on Windows).
2. **Configure Secrets & Network**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   **Critical Verification**:
   - **`RPC_SECRET`**: The "Cluster Password".
     - *Action*: Run `openssl rand -hex 32` **ONCE**.
     - *Rule*: Copy this **exact string** to every single device in your cluster. They must all match to talk to each other.
   - **`TS_AUTHKEY`**: Your Tailscale invite.
     - *Action*: Go to [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys) > Settings > Keys > "Generate Auth Key".
     - *Tip*: Use a "Reusable" key so you can use the same one for all laptops.
   - **`TS_HOSTNAME`**: The Device Name.
     - *Rule*: OPTIONAL but recommended. Set this to a unique name for this specific device (e.g., `grandpa-laptop`, `backup-server`). MUST be unique.
3. **(Optional) External Drive**:
   If you want to store the Vault data on an external hard drive:
   - Mount the drive (e.g., to `/mnt/ext_usb`).
   - Edit `.env` and set `DATA_DIR=/mnt/ext_usb/mnemosyne_data`.

4. **Start the Stack**:
   ```bash
   docker compose up -d
   ```
4. **Finalize Configuration**:
   - Check the Tailscale IP of your new container.
   - Update `config.toml` with the correct `public_addr`.
   - Restart the stack: `docker compose restart`.

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
docker exec -it mnemosyne-store /garage status

# 2. Assign Capacity (e.g., 50GB for this laptop)
# Replace <NODE_ID> with the ID from step 1
docker exec -it mnemosyne-store /garage layout assign -z zone1 -c 50G <NODE_ID>

# 3. Apply the Change
docker exec -it mnemosyne-store /garage layout apply --version 1
```
