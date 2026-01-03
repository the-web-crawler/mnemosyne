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
2. **Configure Secrets**:
   ```bash
   cp .env.example .env
   # Edit .env with your Tailscale Key and a generated RPC_SECRET
   ```
3. **Start the Stack**:
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
