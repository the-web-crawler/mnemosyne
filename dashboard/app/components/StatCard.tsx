import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    status?: "healthy" | "danger" | "warning" | "neutral";
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

export function StatCard({ label, value, subValue, status = "neutral", children }: StatCardProps) {
    const statusColor = {
        healthy: "bg-emerald-500 shadow-[0_0_10px_#10b981]",
        danger: "bg-red-500 shadow-[0_0_10px_#ef4444]",
        warning: "bg-amber-500 shadow-[0_0_10px_#f59e0b]",
        neutral: "bg-blue-500 shadow-[0_0_10px_#3b82f6]",
    };

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2 min-h-[140px] justify-between">
            <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 uppercase tracking-widest font-semibold">{label}</span>
                {status !== 'neutral' && (
                    <div className={`w-2 h-2 rounded-full ${statusColor[status]}`} />
                )}
            </div>

            <div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-light text-white tracking-tight">{value}</span>
                    {subValue && <span className="text-sm text-gray-500 mb-1.5">{subValue}</span>}
                </div>
                {children}
            </div>
        </div>
    );
}
