"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

// Current version - baked in at build time
const CURRENT_VERSION = process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 8) || "dev";
const GITHUB_REPO = "the-web-crawler/mnemosyne";

interface UpdateInfo {
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    latestMessage?: string;
}

export function UpdateBanner() {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        checkForUpdates();
    }, []);

    const checkForUpdates = async () => {
        setLoading(true);
        try {
            // Call GitHub API directly from client browser
            const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/master`, {
                headers: { "Accept": "application/vnd.github.v3+json" },
            });

            if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

            const data = await res.json();
            const latestVersion = data.sha?.slice(0, 8) || "";
            const latestMessage = data.commit?.message?.split("\n")[0] || "";

            const updateAvailable = CURRENT_VERSION !== "dev" && CURRENT_VERSION !== latestVersion;

            setUpdateInfo({
                updateAvailable,
                currentVersion: CURRENT_VERSION,
                latestVersion,
                latestMessage,
            });
        } catch (error) {
            console.error("Failed to check for updates:", error);
            setUpdateInfo({ updateAvailable: false, currentVersion: CURRENT_VERSION });
        } finally {
            setLoading(false);
        }
    };

    // Don't show if dismissed, loading, no data, or no update available
    if (dismissed || loading || !updateInfo?.updateAvailable) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600/90 backdrop-blur-sm text-white rounded-lg shadow-lg animate-in slide-in-from-top-4 duration-300">
            <Download size={18} />
            <div className="text-sm">
                <span className="font-medium">Update available!</span>
                <span className="text-emerald-100 ml-2 text-xs">
                    {updateInfo.currentVersion} → {updateInfo.latestVersion}
                </span>
            </div>
            <a
                href="https://github.com/the-web-crawler/mnemosyne"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
            >
                View
            </a>
            <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
