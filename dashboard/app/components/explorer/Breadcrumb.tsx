"use client";

import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbProps {
    path: string;
    onNavigate: (path: string) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    const segments = path ? path.split("/").filter(Boolean) : [];

    const buildPath = (index: number) => {
        return segments.slice(0, index + 1).join("/");
    };

    return (
        <div className="flex items-center gap-1 text-sm text-gray-400">
            <button
                onClick={() => onNavigate("")}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Home"
            >
                <Home size={16} />
            </button>

            {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-1">
                    <ChevronRight size={14} className="text-gray-600" />
                    <button
                        onClick={() => onNavigate(buildPath(index))}
                        className="px-2 py-1 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        {segment}
                    </button>
                </div>
            ))}
        </div>
    );
}
