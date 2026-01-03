# **Project Mnemosyne: The Distributed Archive**

Maintained by: Arachnida Apps (TWC)  
Target User: "The Grandfather"

## **1\. The Mission & The Stakes**

**We are not building a file server. We are building a digital vault for a lifetime of memories.**

This project safeguards a massive, sprawling collection of photographs—digital artifacts that represent decades of relationships, history, and life. The current state (scattered across disparate drives, clouds, and phones) is fragile. A single hardware failure could result in the permanent extinction of these memories.

**The Imperatives:**

1. **Zero Data Loss:** The system must survive house fires, hard drive failures, and accidental deletions.  
2. **Absolute Decentralization:** There is no "Main Server." The system must not rely on a single brain. If the primary desktop dies, the laptop must continue to function.  
3. **Seamless Access:** The complexity must be invisible. To the user, it must behave exactly like a local folder.

## **2\. The Architecture: "The Arachnida Mesh"**

We utilize a stack of three high-efficacy FOSS tools to create a virtual, self-healing, distributed filesystem.

| Layer | Software | Component Type | Function |
| :---- | :---- | :---- | :---- |
| **Network** | **Tailscale** | Docker Container | **The Nervous System.** Creates a secure, zero-config mesh VPN. Acts as the "Network Sidecar," handling all traffic for the storage and interface nodes. |
| **Storage** | **Garage** | Docker Container | **The Brain.** A distributed, S3-compatible storage engine. It shards files, replicates them across nodes, and self-heals when nodes go offline. |
| **Interface** | **Rclone** | Docker Container | **The Hands.** Connects to Garage and serves the files via WebDAV. This allows the host OS to map the archive as a network drive without needing complex drivers. |
| **Management** | **Dashboard** | Next.js Container | **The Face.** A lightweight web interface that connects to the Garage Admin API. Allows users to view health status and reallocate storage limits from any device. |

## **3\. The Deployment Strategy (Fully Dockerized)**

This setup uses the **Sidecar Pattern**. The garage and rclone containers do not have their own IP addresses; they attach directly to the tailscale container's network namespace.

### **Prerequisites (All Nodes)**

1. **Docker Desktop (Windows)** or **Docker Engine (Linux)** installed.  
2. **Tailscale Auth Key:** Generated from the Tailscale Admin Console (Settings \> Keys \> Generate Auth Key). Make it **Reusable** and **Ephemeral** (unless it's a permanent server).

### **Step A: The "Node" Installer**

Create a directory C:\\Mnemosyne (or \~/mnemosyne) on **every device**.

#### **1\. .env (Secrets File)**

Create a file named .env to store your specific configuration.

\# Tailscale Setup  
TS\_AUTHKEY=tskey-auth-xxxxxx-xxxxxx  \# Paste your generated key here  
TS\_HOSTNAME=grandpa-laptop          \# Unique name for each device

\# Garage Setup  
\# Generate this ONCE via \`openssl rand \-hex 32\` and use on ALL nodes  
RPC\_SECRET=replace\_this\_with\_shared\_32\_byte\_hex\_secret

\# Dashboard Auth  
ADMIN\_TOKEN=create\_a\_secure\_token\_for\_the\_dashboard\_api

#### **2\. docker-compose.yml**

This defines the entire stack. Copy this exact file to all nodes.

services:  
  \# \--- Layer 1: The Nervous System \---  
  tailscale:  
    image: tailscale/tailscale:latest  
    container\_name: mnemosyne-net  
    hostname: ${TS\_HOSTNAME}  
    environment:  
      \- TS\_AUTHKEY=${TS\_AUTHKEY}  
      \- TS\_STATE\_DIR=/var/lib/tailscale  
      \- TS\_USERSPACE=false \# Requires privileged mode  
    volumes:  
      \- ./ts\_state:/var/lib/tailscale  
      \- /dev/net/tun:/dev/net/tun \# Required for Linux/Tun  
    cap\_add:  
      \- NET\_ADMIN  
      \- SYS\_MODULE  
    restart: unless-stopped  
    \# Expose WebDAV (8080) and Dashboard (3000) to the host  
    ports:  
      \- "127.0.0.1:8080:8080"  
      \- "127.0.0.1:3000:3000"

  \# \--- Layer 2: The Brain \---  
  garage:  
    image: dxflrs/garage:v0.9  
    container\_name: mnemosyne-store  
    restart: unless-stopped  
    \# SIDECAR: Share the network stack of Tailscale  
    network\_mode: service:tailscale  
    volumes:  
      \- ./meta:/var/lib/garage/meta  
      \- ./data:/var/lib/garage/data  
      \- ./config.toml:/etc/garage.toml  
    environment:  
      \- RUST\_LOG=info

  \# \--- Layer 3: The Interface \---  
  rclone:  
    image: rclone/rclone:latest  
    container\_name: mnemosyne-mount  
    restart: unless-stopped  
    \# SIDECAR: Share network to reach Garage on localhost  
    network\_mode: service:tailscale   
    environment:  
      \# Configure Rclone via Env Vars (No config file needed)  
      \- RCLONE\_CONFIG\_ARCHIVE\_TYPE=s3  
      \- RCLONE\_CONFIG\_ARCHIVE\_PROVIDER=Other  
      \- RCLONE\_CONFIG\_ARCHIVE\_ENV\_AUTH=false  
      \- RCLONE\_CONFIG\_ARCHIVE\_ACCESS\_KEY\_ID=${TS\_HOSTNAME} \# Using Hostname as Key ID for simplicity  
      \- RCLONE\_CONFIG\_ARCHIVE\_SECRET\_ACCESS\_KEY=${RPC\_SECRET} \# Using RPC secret as S3 key for simplicity  
      \- RCLONE\_CONFIG\_ARCHIVE\_ENDPOINT=\[http://127.0.0.1:3900\](http://127.0.0.1:3900)  
      \- RCLONE\_CONFIG\_ARCHIVE\_REGION=garage  
      \- RCLONE\_CONFIG\_ARCHIVE\_ACL=private  
    \# Serve WebDAV on port 8080 (Mapped by Tailscale container above)  
    command: \>  
      serve webdav remote:archive   
      \--addr :8080   
      \--vfs-cache-mode full   
      \--vfs-cache-max-size 20G   
      \--vfs-cache-max-age 720h   
      \--dir-cache-time 1000h

  \# \--- Layer 4: The Management Dashboard \---  
  dashboard:  
    image: the-web-crawler/mnemosyne:latest \# Custom build  
    container\_name: mnemosyne-dash  
    restart: unless-stopped  
    network\_mode: service:tailscale  
    environment:  
      \- GARAGE\_ADMIN\_URL=\[http://127.0.0.1:3903\](http://127.0.0.1:3903)  
      \- GARAGE\_ADMIN\_TOKEN=${ADMIN\_TOKEN}

#### **3\. config.toml (Garage Config)**

Create this file for the storage logic.

metadata\_dir \= "/var/lib/garage/meta"  
data\_dir \= "/var/lib/garage/data"  
db\_engine \= "sqlite"  
replication\_factor \= 2

\[rpc\]  
bind\_addr \= "\[::\]:3901"  
\# IMPORTANT: This must match the Tailscale IP.   
\# Since we are using Docker, run 'docker compose up' once,   
\# check the Tailscale console for the IP, then update this file and restart.  
public\_addr \= "100.x.y.z:3901"   
secret \= "REPLACE\_WITH\_RPC\_SECRET\_FROM\_ENV\_FILE"

\[s3\_api\]  
s3\_region \= "garage"  
api\_bind\_addr \= "\[::\]:3900"  
root\_domain \= ".s3.local"

\# ENABLE ADMIN API for the Dashboard  
\[admin\]  
api\_bind\_addr \= "\[::\]:3903"  
admin\_token \= "REPLACE\_WITH\_ADMIN\_TOKEN\_FROM\_ENV\_FILE"

#### **4\. Initialization**

Run the stack:

docker compose up \-d

### **Step B: The Cluster Handshake (One-Time Setup)**

After the containers are running, you must link them.

1. Get Node IDs:  
   Run this command on each machine to find its ID:  
   docker exec \-it mnemosyne-store /garage status

2. **Assign Layout (Via Dashboard or CLI):**  
   *Option A: CLI (Run on ONE node only)*  
   \# Example: Assign 50GB to Grandpa and 4TB to Server  
   docker exec \-it mnemosyne-store /garage layout assign \-z zone1 \-c 50G \<GRANDPA\_NODE\_ID\>  
   docker exec \-it mnemosyne-store /garage layout assign \-z zone1 \-c 4T \<SERVER\_NODE\_ID\>

   \# Apply changes  
   docker exec \-it mnemosyne-store /garage layout apply \--version 1

   Option B: Dashboard  
   Open http://localhost:3000 to visualize nodes and drag sliders to adjust capacity.  
3. **Create Keys & Enable Versioning:**  
   \# We use the TS\_HOSTNAME and RPC\_SECRET as keys for simplicity in the Rclone config above  
   docker exec \-it mnemosyne-store /garage key create \<TS\_HOSTNAME\>   
   docker exec \-it mnemosyne-store /garage key import \<TS\_HOSTNAME\> \<RPC\_SECRET\>  
   docker exec \-it mnemosyne-store /garage bucket create archive

   \# RESILIENCE: Enable Versioning to prevent accidental deletion  
   docker exec \-it mnemosyne-store /garage bucket update \--versioning-enabled true archive

   docker exec \-it mnemosyne-store /garage bucket allow \--read \--write \--key\_id \<TS\_HOSTNAME\> archive

### **Step C: The Windows Interface (Map Drive)**

Since Rclone is running inside Docker, we need to map the WebDAV share to a drive letter on Windows.

**ConnectDrive.bat (Place on Desktop)**

@echo off  
echo Connecting to Mnemosyne Archive...  
timeout /t 5 \>nul

:: Delete Z: if it exists (cleanup)  
net use Z: /delete /y \>nul 2\>&1

:: Map Z: to the Docker WebDAV server  
net use Z: http://localhost:8080 /persistent:yes

echo Connection established. Drive Z: is ready.  
pause

## **6\. Maintenance & Updates**

Because this system is fully containerized, updating configuration or software versions is safe and reversible.

### **Scenario: Changing Rclone Settings (e.g., Cache Size)**

1. Open docker-compose.yml on the specific node.  
2. Locate the rclone service's command block.  
3. Edit the flag (e.g., change \--vfs-cache-max-size 20G to 50G).  
4. Run docker compose up \-d.  
   * *Result:* Docker detects the change, stops *only* the Rclone container, and recreates it. The drive mapping may flicker for 2-3 seconds.

### **Scenario: Updating Software (e.g., New Garage Version)**

1. Open docker-compose.yml.  
2. Update the image tag (e.g., change dxflrs/garage:v0.9 to v0.10).  
3. Run docker compose pull && docker compose up \-d.  
   * *Result:* The new binary is downloaded and the service restarts.  
   * *Note:* Garage supports rolling updates. You can update one node at a time without taking down the mesh.

## **7\. Protocol for Replication (New Users)**

To deploy this system for a different user (e.g., a client or another relative), you do not need to rewrite the code. You simply need to isolate the **Network** and the **Data** by changing two variables.

### **The Two Keys to Isolation**

1. **Network Layer (TS\_AUTHKEY):**  
   * **Action:** Log into the **new user's** individual Tailscale account. Generate a new Auth Key.  
   * **Effect:** This creates a completely separate VPN topology. The new user's devices cannot see yours, and vice versa.  
2. **Data Layer (RPC\_SECRET):**  
   * **Action:** Generate a new random 32-byte hex string (openssl rand \-hex 32).  
   * **Effect:** This creates a new cryptographic universe for the storage mesh. Even if the networks overlapped, the nodes would reject each other's data packets because they speak a different dialect.

### **Deployment Checklist for User B**

1. Copy the docker-compose.yml exactly (no changes needed).  
2. Create a **new** .env file with **User B's** TS\_AUTHKEY and the **new** RPC\_SECRET.  
3. Run docker compose up \-d.