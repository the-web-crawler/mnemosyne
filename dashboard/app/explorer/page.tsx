"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileGrid } from "../components/explorer/FileGrid";
import { Breadcrumb } from "../components/explorer/Breadcrumb";
import { ContextMenu, MenuItem } from "../components/explorer/ContextMenu";
import { UploadDialog } from "../components/explorer/UploadDialog";
import { FileEditor } from "../components/explorer/FileEditor";
import {
    Upload,
    FolderPlus,
    RefreshCw,
    LayoutGrid,
    List,
    FilePlus,
    Trash2,
    Download,
    Edit,
    Pin,
    PinOff,
    ArrowLeft
} from "lucide-react";

export interface FileItem {
    name: string;
    path: string;
    type: "file" | "folder";
    size: number;
    lastModified: string;
    mimeType?: string;
}

export default function ExplorerPage() {
    const [currentPath, setCurrentPath] = useState("");
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [pinnedFiles, setPinnedFiles] = useState<Set<string>>(new Set());

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file?: FileItem } | null>(null);

    // Dialogs
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editorFile, setEditorFile] = useState<FileItem | null>(null);

    // Load files - only update state if content actually changed
    const loadFiles = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`);
            const data = await res.json();
            const newFiles = data.files || [];

            // Only update if the file list actually changed (prevents flashing)
            setFiles(prevFiles => {
                // Compare by serializing - simple but effective
                const prevJson = JSON.stringify(prevFiles.map(f => f.path).sort());
                const newJson = JSON.stringify(newFiles.map((f: FileItem) => f.path).sort());

                if (prevJson === newJson) {
                    return prevFiles; // No change - keep existing state
                }
                return newFiles;
            });
        } catch (err) {
            console.error("Failed to load files:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [currentPath]);

    // Initial load (with loading indicator) and silent auto-refresh every 10 seconds
    useEffect(() => {
        loadFiles(true); // Initial load shows loading state
        const interval = setInterval(() => loadFiles(false), 10000); // Auto-refresh is silent
        return () => clearInterval(interval);
    }, [loadFiles]);

    // Load pinned files from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("mnemosyne-pins");
        if (stored) {
            setPinnedFiles(new Set(JSON.parse(stored)));
        }
    }, []);

    // Save pins to localStorage
    const savePins = (pins: Set<string>) => {
        localStorage.setItem("mnemosyne-pins", JSON.stringify([...pins]));
        setPinnedFiles(pins);
    };

    // Navigate to folder
    const navigateTo = (path: string) => {
        setCurrentPath(path);
        setSelectedFiles(new Set());
    };

    // Handle file click
    const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
        if (file.type === "folder") {
            navigateTo(file.path);
        } else {
            // Toggle selection with Ctrl, otherwise single select
            if (event.ctrlKey || event.metaKey) {
                const newSelected = new Set(selectedFiles);
                if (newSelected.has(file.path)) {
                    newSelected.delete(file.path);
                } else {
                    newSelected.add(file.path);
                }
                setSelectedFiles(newSelected);
            } else {
                setSelectedFiles(new Set([file.path]));
            }
        }
    };

    // Handle file double-click
    const handleFileDoubleClick = (file: FileItem) => {
        if (file.type === "folder") {
            navigateTo(file.path);
        } else if (file.mimeType?.startsWith("text/") || file.mimeType === "application/json") {
            setEditorFile(file);
        } else {
            // Download
            window.open(`/api/files/${file.path}`, "_blank");
        }
    };

    // Context menu
    const handleContextMenu = (event: React.MouseEvent, file?: FileItem) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, file });
    };

    // Delete selected files
    const handleDelete = async () => {
        const toDelete = contextMenu?.file
            ? [contextMenu.file.path]
            : [...selectedFiles];

        for (const path of toDelete) {
            try {
                await fetch(`/api/files/${path}`, { method: "DELETE" });
            } catch (err) {
                console.error(`Failed to delete ${path}:`, err);
            }
        }

        setSelectedFiles(new Set());
        setContextMenu(null);
        loadFiles(true);
    };

    // Download file
    const handleDownload = () => {
        if (contextMenu?.file) {
            window.open(`/api/files/${contextMenu.file.path}`, "_blank");
        }
        setContextMenu(null);
    };

    // Toggle pin
    const handleTogglePin = () => {
        if (contextMenu?.file) {
            const newPins = new Set(pinnedFiles);
            if (newPins.has(contextMenu.file.path)) {
                newPins.delete(contextMenu.file.path);
            } else {
                newPins.add(contextMenu.file.path);
            }
            savePins(newPins);
        }
        setContextMenu(null);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === "Delete") {
                if (selectedFiles.size > 0) {
                    handleDelete();
                }
            } else if (e.key === "Escape") {
                setSelectedFiles(new Set());
                setContextMenu(null);
            } else if (e.ctrlKey && e.key === "a") {
                e.preventDefault();
                setSelectedFiles(new Set(files.filter(f => f.type === "file").map(f => f.path)));
            } else if (e.ctrlKey && e.key === "u") {
                e.preventDefault();
                setUploadOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [files, selectedFiles]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    // Build context menu items
    const getContextMenuItems = (): MenuItem[] => {
        const items: MenuItem[] = [];

        if (contextMenu?.file) {
            const file = contextMenu.file;
            const isPinned = pinnedFiles.has(file.path);

            if (file.type === "file") {
                items.push({ icon: Download, label: "Download", onClick: handleDownload });

                if (file.mimeType?.startsWith("text/") || file.mimeType === "application/json") {
                    items.push({ icon: Edit, label: "Edit", onClick: () => { setEditorFile(file); setContextMenu(null); } });
                }
            }

            items.push({ icon: isPinned ? PinOff : Pin, label: isPinned ? "Unpin" : "Pin", onClick: handleTogglePin });
            items.push({ divider: true });
            items.push({ icon: Trash2, label: "Delete", onClick: handleDelete, danger: true });
        } else {
            // Background context menu
            items.push({ icon: Upload, label: "Upload File", onClick: () => { setUploadOpen(true); setContextMenu(null); } });
            items.push({ icon: FolderPlus, label: "New Folder", onClick: () => { /* TODO */ setContextMenu(null); } });
            items.push({ icon: FilePlus, label: "New Document", onClick: () => { /* TODO */ setContextMenu(null); } });
            items.push({ divider: true });
            items.push({ icon: RefreshCw, label: "Refresh", onClick: () => { loadFiles(true); setContextMenu(null); } });
        }

        return items;
    };

    return (
        <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 glass-panel glass-panel-hover rounded-lg"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">File Explorer</h1>
                            <Breadcrumb path={currentPath} onNavigate={navigateTo} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setUploadOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                            <Upload size={18} />
                            Upload
                        </button>

                        <div className="flex glass-panel rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-2 ${viewMode === "grid" ? "bg-white/10" : "hover:bg-white/5"}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 ${viewMode === "list" ? "bg-white/10" : "hover:bg-white/5"}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => loadFiles(true)}
                            className="p-2 glass-panel glass-panel-hover rounded-lg"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </header>

                {/* Pinned Files */}
                {pinnedFiles.size > 0 && (
                    <section className="mb-6">
                        <h2 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <Pin size={14} />
                            Pinned
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {[...pinnedFiles].map(path => {
                                const name = path.split("/").pop() || path;
                                return (
                                    <button
                                        key={path}
                                        onClick={() => navigateTo(path.split("/").slice(0, -1).join("/"))}
                                        className="px-3 py-1.5 glass-panel glass-panel-hover rounded-lg text-sm flex items-center gap-2"
                                    >
                                        <Pin size={12} className="text-emerald-400" />
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* File Grid/List */}
                <div
                    className="min-h-[400px]"
                    onContextMenu={(e) => handleContextMenu(e)}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <RefreshCw className="animate-spin mr-2" />
                            Loading...
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <FolderPlus size={48} className="mb-4 opacity-50" />
                            <p>This folder is empty</p>
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="mt-4 text-emerald-400 hover:text-emerald-300"
                            >
                                Upload files
                            </button>
                        </div>
                    ) : (
                        <FileGrid
                            files={files}
                            viewMode={viewMode}
                            selectedFiles={selectedFiles}
                            pinnedFiles={pinnedFiles}
                            onFileClick={handleFileClick}
                            onFileDoubleClick={handleFileDoubleClick}
                            onContextMenu={handleContextMenu}
                        />
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={getContextMenuItems()}
                    />
                )}

                {/* Upload Dialog */}
                <UploadDialog
                    open={uploadOpen}
                    onClose={() => setUploadOpen(false)}
                    currentPath={currentPath}
                    onUploadComplete={loadFiles}
                />

                {/* File Editor */}
                {editorFile && (
                    <FileEditor
                        file={editorFile}
                        onClose={() => setEditorFile(null)}
                        onSave={loadFiles}
                    />
                )}
            </div>
        </div>
    );
}
