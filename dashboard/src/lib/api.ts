import { type NextRequest } from "next/server";

export interface NodeStatus {
    id: string;
    hostname: string;
    is_up: boolean;
    last_seen: number; // timestamp
    usagePercent: number;
    storageUsed: string;
}

export interface ClusterStatus {
    status: "healthy" | "degraded" | "offline";
    node_count: number;
    total_storage: string;
    used_storage: string;
    usedBytes?: number;
    totalBytes?: number;
    nodes: NodeStatus[];
}

// Mock Data for Dev/Preview
const MOCK_DATA: ClusterStatus = {
    status: "healthy",
    node_count: 3,
    total_storage: "1.5 TB",
    used_storage: "420 GB",
    nodes: [
        { id: "123", hostname: "my-laptop", is_up: true, last_seen: Date.now(), usagePercent: 25, storageUsed: "120 GB" },
        { id: "456", hostname: "grandma-pc", is_up: true, last_seen: Date.now() - 1000 * 60, usagePercent: 8, storageUsed: "50 GB" },
        { id: "789", hostname: "offsite-pi", is_up: false, last_seen: Date.now() - 1000 * 60 * 60 * 24, usagePercent: 90, storageUsed: "900 GB" },
    ],
};

// Real API Client
export async function getClusterStatus(): Promise<ClusterStatus> {
    const adminUrl = process.env.GARAGE_ADMIN_URL || "http://127.0.0.1:3903";
    const token = process.env.GARAGE_ADMIN_TOKEN;

    // Function to create standard auth headers
    const getHeaders = () => ({
        "Authorization": `Bearer ${token}`,
    });

    try {
        console.log(`[API] Fetching status from ${adminUrl}/v1/status with token ending in ...${token?.slice(-6)}`);

        // 1. Fetch Health/Status
        const statusRes = await fetch(`${adminUrl}/v1/status`, {
            headers: getHeaders(),
            next: { revalidate: 10 } // Cache for 10s
        });

        console.log(`[API] Response Status: ${statusRes.status} ${statusRes.statusText}`);

        if (!statusRes.ok) {
            const txt = await statusRes.text();
            console.error(`[API] Error Body: ${txt}`);
            throw new Error(`Garage API Error: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();
        // console.log(`[API] Raw Data:`, JSON.stringify(statusData, null, 2));

        // Map Garage response (v1.0.0 /health) to our UI model
        const nodes: NodeStatus[] = (statusData.nodes || []).map((n: any) => {
            // Priority: Use Assigned Role Capacity -> Fallback to Physical Disk Total
            const assignedCapacity = n.role?.capacity || 0;
            const physicalTotal = n.dataPartition?.total || 0;

            // For "Used", Garage v1 /status doesn't give a simple "bytes used" per node easily 
            // without calculating partition usage.
            // For now, we will show "Allocated" vs "Physical Free" or just "Allocated".
            // Let's use Assigned Capacity as the "Total" for the bar.

            const totalForBar = assignedCapacity > 0 ? assignedCapacity : physicalTotal;

            // Format storage string (e.g. "10 GB")
            const formatBytes = (bytes: number) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            };

            return {
                id: n.id,
                hostname: n.hostname || "Unknown",
                is_up: n.isUp === true,
                last_seen: n.lastSeenSecsAgo !== null ? Date.now() - (n.lastSeenSecsAgo * 1000) : Date.now(),
                // Show 0% used for now since we don't have accurate 'used' bytes from this endpoint
                usagePercent: 0,
                storageUsed: `${formatBytes(totalForBar)} Allocated`
            };
        });

        const activeNodes = nodes.filter(n => n.is_up).length;
        let clusterState: "healthy" | "degraded" | "offline" = "healthy";

        if (activeNodes === 0) clusterState = "offline";
        else if (activeNodes < nodes.length) clusterState = "degraded";

        // Aggregate Totals - use dataPartition.available for actual disk space
        const totalAvailableBytes = (statusData.nodes || []).reduce((acc: number, curr: any) => {
            if (curr.isUp && curr.dataPartition?.available) {
                return acc + curr.dataPartition.available;
            }
            return acc;
        }, 0);

        // Get allocated capacity from roles
        const totalAllocatedBytes = (statusData.nodes || []).reduce((acc: number, curr: any) => {
            return acc + (curr.role?.capacity || 0);
        }, 0);

        const formatGlobalBytes = (bytes: number) => {
            if (bytes === 0) return 'Unknown';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        };

        // Fetch bucket info to get actual used storage
        let usedBytes = 0;
        try {
            const bucketRes = await fetch(`${adminUrl}/v1/bucket?id=archive`, {
                headers: getHeaders(),
                next: { revalidate: 10 }
            });
            if (bucketRes.ok) {
                const bucketData = await bucketRes.json();
                usedBytes = bucketData.bytes || 0;
            }
        } catch (e) {
            console.warn("[API] Could not fetch bucket info for used storage");
        }

        return {
            status: clusterState,
            node_count: nodes.length,
            total_storage: formatGlobalBytes(totalAvailableBytes || totalAllocatedBytes),
            used_storage: formatGlobalBytes(usedBytes),
            usedBytes,
            totalBytes: totalAvailableBytes || totalAllocatedBytes,
            nodes: nodes
        };

    } catch (e) {
        console.error("Failed to fetch cluster status:", e);
        // Return Error State
        return {
            status: "offline",
            node_count: 0,
            total_storage: "N/A",
            used_storage: "N/A",
            nodes: []
        };
    }
}
