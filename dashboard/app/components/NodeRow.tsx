"use client";

import React, { useState, useEffect } from 'react';

interface NodeRowProps {
    hostname: string;
    id: string;
    isUp: boolean;
    lastSeen: number;
    usagePercent: number;
    storageUsed: string;
}

export function NodeRow({ hostname, id, isUp, lastSeen, usagePercent, storageUsed }: NodeRowProps) {
    // State
    const [nickname, setNickname] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");

    // Load nickname on mount
    useEffect(() => {
        const stored = localStorage.getItem(`node_nick_${id}`);
        if (stored) setNickname(stored);
    }, [id]);

    const handleStartEdit = () => {
        setEditValue(nickname || hostname);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!editValue.trim()) {
            localStorage.removeItem(`node_nick_${id}`);
            setNickname(null);
        } else {
            localStorage.setItem(`node_nick_${id}`, editValue.trim());
            setNickname(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    const displayName = nickname || hostname || "Unknown Host";

    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group">
            <div className="flex items-center gap-4 flex-1">
                {/* Status indicator */}
                <div className="relative shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isUp && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                </div>

                <div className="flex flex-col min-w-[140px]">
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <input
                                autoFocus
                                className="bg-black/20 border border-blue-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-blue-500 w-32"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                            />
                        ) : (
                            <span
                                className="font-medium text-white group-hover:text-blue-200 transition-colors cursor-pointer select-none"
                                onClick={handleStartEdit}
                                title="Click to rename"
                            >
                                {displayName}
                            </span>
                        )}

                        {!isEditing && (
                            <button
                                onClick={handleStartEdit}
                                className="text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </button>
                        )}
                    </div>

                    <span className="text-xs text-gray-500 font-mono tracking-wide">
                        {id.substring(0, 16)}...
                    </span>
                </div>

                {/* Capacity Bar */}
                <div className="flex-1 max-w-xs mx-4 hidden sm:block">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>{usagePercent.toFixed(1)}% Used</span>
                        <span>{storageUsed}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="text-right shrink-0">
                <div className={`text-sm font-medium ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? 'Online' : 'Offline'}
                </div>
                <div className="text-xs text-gray-600">
                    {isUp ? 'Active now' : `Last seen: ${new Date(lastSeen).toLocaleDateString()}`}
                </div>
            </div>
        </div>
    );
}
