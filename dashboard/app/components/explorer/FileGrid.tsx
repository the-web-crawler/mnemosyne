"use client";

import { FileItem } from "@/app/explorer/page";
import {
    Folder,
    File,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileCode,
    Pin
} from "lucide-react";

interface FileGridProps {
    files: FileItem[];
    viewMode: "grid" | "list";
    selectedFiles: Set<string>;
    pinnedFiles: Set<string>;
    onFileClick: (file: FileItem, event: React.MouseEvent) => void;
    onFileDoubleClick: (file: FileItem) => void;
    onContextMenu: (event: React.MouseEvent, file: FileItem) => void;
}

export function FileGrid({
    files,
    viewMode,
    selectedFiles,
    pinnedFiles,
    onFileClick,
    onFileDoubleClick,
    onContextMenu,
}: FileGridProps) {
    // Sort: folders first, then files
    const sortedFiles = [...files].sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    const getFileIcon = (file: FileItem) => {
        if (file.type === "folder") return Folder;

        const mime = file.mimeType || "";
        if (mime.startsWith("image/")) return FileImage;
        if (mime.startsWith("video/")) return FileVideo;
        if (mime.startsWith("audio/")) return FileAudio;
        if (mime.startsWith("text/")) return FileText;
        if (mime === "application/json") return FileCode;
        if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip")) return FileArchive;
        return File;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    const isImage = (file: FileItem) => file.mimeType?.startsWith("image/");

    if (viewMode === "list") {
        return (
            <div className="glass-panel rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_120px] gap-4 px-4 py-3 text-xs text-gray-500 border-b border-white/10">
                    <span>Name</span>
                    <span className="text-right">Size</span>
                    <span className="text-right">Modified</span>
                </div>

                {/* Rows */}
                {sortedFiles.map((file) => {
                    const Icon = getFileIcon(file);
                    const isSelected = selectedFiles.has(file.path);
                    const isPinned = pinnedFiles.has(file.path);

                    return (
                        <div
                            key={file.path}
                            className={`grid grid-cols-[1fr_100px_120px] gap-4 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-emerald-500/20" : "hover:bg-white/5"
                                }`}
                            onClick={(e) => onFileClick(file, e)}
                            onDoubleClick={() => onFileDoubleClick(file)}
                            onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, file); }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <Icon
                                    size={18}
                                    className={file.type === "folder" ? "text-yellow-400" : "text-gray-400"}
                                />
                                <span className="truncate">{file.name}</span>
                                {isPinned && <Pin size={12} className="text-emerald-400 flex-shrink-0" />}
                            </div>
                            <span className="text-gray-500 text-sm text-right">
                                {file.type === "file" ? formatSize(file.size) : "—"}
                            </span>
                            <span className="text-gray-500 text-sm text-right">
                                {formatDate(file.lastModified)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Grid view
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedFiles.map((file) => {
                const Icon = getFileIcon(file);
                const isSelected = selectedFiles.has(file.path);
                const isPinned = pinnedFiles.has(file.path);
                const showThumbnail = isImage(file);

                return (
                    <div
                        key={file.path}
                        className={`glass-panel rounded-xl p-3 cursor-pointer transition-all ${isSelected
                                ? "ring-2 ring-emerald-500 bg-emerald-500/10"
                                : "glass-panel-hover"
                            }`}
                        onClick={(e) => onFileClick(file, e)}
                        onDoubleClick={() => onFileDoubleClick(file)}
                        onContextMenu={(e) => { e.stopPropagation(); onContextMenu(e, file); }}
                    >
                        {/* Thumbnail or Icon */}
                        <div className="aspect-square rounded-lg bg-black/20 flex items-center justify-center mb-2 overflow-hidden">
                            {showThumbnail ? (
                                <img
                                    src={`/api/files/${file.path}`}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <Icon
                                    size={40}
                                    className={file.type === "folder" ? "text-yellow-400" : "text-gray-500"}
                                />
                            )}
                        </div>

                        {/* Name */}
                        <div className="flex items-center gap-1">
                            {isPinned && <Pin size={10} className="text-emerald-400 flex-shrink-0" />}
                            <span className="text-sm truncate" title={file.name}>
                                {file.name}
                            </span>
                        </div>

                        {/* Size */}
                        {file.type === "file" && (
                            <span className="text-xs text-gray-500">
                                {formatSize(file.size)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
