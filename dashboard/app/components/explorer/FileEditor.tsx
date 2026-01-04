"use client";

import { useState, useEffect } from "react";
import { X, Save, FileText } from "lucide-react";
import { FileItem } from "@/app/explorer/page";

interface FileEditorProps {
    file: FileItem;
    onClose: () => void;
    onSave: () => void;
}

export function FileEditor({ file, onClose, onSave }: FileEditorProps) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load file content
    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/files/${file.path}`);
                if (response.ok) {
                    const text = await response.text();
                    setContent(text);
                }
            } catch (error) {
                console.error("Failed to load file:", error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, [file.path]);

    // Handle save
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/files/${file.path}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                setHasChanges(false);
                onSave();
            }
        } catch (error) {
            console.error("Failed to save file:", error);
        } finally {
            setSaving(false);
        }
    };

    // Handle content change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setHasChanges(true);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                if (hasChanges) handleSave();
            }
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasChanges, content]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-panel rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-400" />
                        <h2 className="font-semibold text-white">{file.name}</h2>
                        {hasChanges && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                Unsaved
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                        >
                            <Save size={14} />
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-4 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Loading...
                        </div>
                    ) : (
                        <textarea
                            value={content}
                            onChange={handleChange}
                            className="w-full h-full bg-black/30 rounded-lg p-4 text-sm font-mono text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            spellCheck={false}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-500 flex justify-between">
                    <span>{file.path}</span>
                    <span>Ctrl+S to save • Esc to close</span>
                </div>
            </div>
        </div>
    );
}
