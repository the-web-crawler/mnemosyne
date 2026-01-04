"use client";

import { useEffect, useState } from "react";
import { ClusterStatus } from "@/src/lib/api";
import { StatCard } from "./StatCard";
import { NodeRow } from "./NodeRow";

interface DashboardStatusProps {
    initialData: ClusterStatus;
}

export function DashboardStatus({ initialData }: DashboardStatusProps) {
    const [data, setData] = useState<ClusterStatus>(initialData);

    useEffect(() => {
        // Poll every 5 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/status");
                if (res.ok) {
                    const newData = await res.json();
                    // React automatically handles diffing, so we just update state
                    setData(newData);
                }
            } catch (error) {
                console.error("Failed to update status:", error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
                <StatCard
                    label="Cluster Health"
                    value={data.status}
                    status={data.status === 'healthy' ? 'healthy' : data.status === 'degraded' ? 'warning' : 'danger'}
                >
                    <div className="text-xs text-gray-500 mt-2">
                        {data.status === 'healthy' ? 'All systems operational' : 'Attention required'}
                    </div>
                </StatCard>

                <StatCard
                    label="Storage"
                    value={data.used_storage}
                    subValue={`/ ${data.total_storage}`}
                >
                    <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(1, ((data.usedBytes || 0) / (data.totalBytes || 1)) * 100))}%` }}
                        />
                    </div>
                </StatCard>

                <StatCard
                    label="Nodes"
                    value={data.node_count}
                    subValue="Total"
                    status="neutral"
                >
                    <div className="text-xs text-gray-500 mt-2">
                        {data.nodes.filter(n => n.is_up).length} Active Now
                    </div>
                </StatCard>
            </div>

            {/* Node List */}
            <section className="mt-4">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-semibold text-white">Cluster Nodes</h2>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            Live Data
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {data.nodes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-white/5 rounded-2xl italic">
                            No nodes found or unable to connect to Garage.
                        </div>
                    ) : (
                        data.nodes.map((node) => (
                            <NodeRow
                                key={node.id}
                                id={node.id}
                                hostname={node.hostname}
                                isUp={node.is_up}
                                lastSeen={node.last_seen}
                                usagePercent={node.usagePercent}
                                storageUsed={node.storageUsed}
                            />
                        ))
                    )}
                </div>
            </section>
        </>
    );
}
