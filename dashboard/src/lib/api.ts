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
        // 1. Fetch Health/Status
        const statusRes = await fetch(`${adminUrl}/status`, {
            headers: getHeaders(),
            next: { revalidate: 10 } // Cache for 10s
        });

        if (!statusRes.ok) {
            throw new Error(`Garage API Error: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();
        // Map Garage response to our UI model
        // Note: Garage API response structure varies, we adapt based on standard v0.9/v1.0 specs
        // 'statusData' usually contains 'knownNodes' array.

        const nodes: NodeStatus[] = (statusData.knownNodes || []).map((n: any) => ({
            id: n.id,
            hostname: n.hostname || "Unknown",
            is_up: n.isUp === true, // Strict check
            last_seen: n.lastSeen ? n.lastSeen * 1000 : 0, // Garage uses seconds usually
            usagePercent: 0, // TODO: Real logic from Garage
            storageUsed: "0 B"
        }));

        const activeNodes = nodes.filter(n => n.is_up).length;
        let clusterState: "healthy" | "degraded" | "offline" = "healthy";

        if (activeNodes === 0) clusterState = "offline";
        else if (activeNodes < nodes.length) clusterState = "degraded";

        // 2. Fetch Storage Info (if available, e.g. from /layout or /health)
        // For now, we simulate storage totals or fetch from another endpoint if needed.
        // Garage doesn't have a simple "global used" endpoint, it's per node.
        // We'll verify this part later, using '1' as a placeholder.

        return {
            status: clusterState,
            node_count: nodes.length,
            total_storage: "Unknown", // Requires /layout call aggregation
            used_storage: "Unknown",
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
