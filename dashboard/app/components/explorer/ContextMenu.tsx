"use client";

import { LucideIcon } from "lucide-react";

export interface MenuItem {
    icon?: LucideIcon;
    label?: string;
    onClick?: () => void;
    danger?: boolean;
    divider?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
}

export function ContextMenu({ x, y, items }: ContextMenuProps) {
    // Adjust position to stay within viewport
    const menuWidth = 200;
    const menuHeight = items.length * 36;

    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 16);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 16);

    return (
        <div
            className="fixed z-50 bg-gray-900 border border-white/20 rounded-lg py-1 shadow-2xl min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
            style={{ left: adjustedX, top: adjustedY }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => {
                if (item.divider) {
                    return <div key={index} className="h-px bg-white/10 my-1" />;
                }

                const Icon = item.icon;

                return (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className={`w-full px-3 py-2 flex items-center gap-3 text-sm transition-colors ${item.danger
                            ? "text-red-400 hover:bg-red-500/20"
                            : "text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        {Icon && <Icon size={16} />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
