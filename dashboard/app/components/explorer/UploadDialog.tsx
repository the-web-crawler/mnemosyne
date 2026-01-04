"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";

interface UploadDialogProps {
    open: boolean;
    onClose: () => void;
    currentPath: string;
    onUploadComplete: () => void;
}

interface UploadItem {
    file: File;
    status: "pending" | "uploading" | "done" | "error";
    progress: number;
}

export function UploadDialog({ open, onClose, currentPath, onUploadComplete }: UploadDialogProps) {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: FileList | File[]) => {
        const newUploads: UploadItem[] = Array.from(files).map(file => ({
            file,
            status: "pending",
            progress: 0,
        }));
        setUploads(prev => [...prev, ...newUploads]);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const uploadAll = async () => {
        for (let i = 0; i < uploads.length; i++) {
            if (uploads[i].status !== "pending") continue;

            setUploads(prev => prev.map((u, idx) =>
                idx === i ? { ...u, status: "uploading" } : u
            ));

            try {
                const file = uploads[i].file;
                const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

                const response = await fetch(`/api/files/${filePath}`, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": file.type || "application/octet-stream",
                    },
                });

                if (!response.ok) throw new Error("Upload failed");

                setUploads(prev => prev.map((u, idx) =>
                    idx === i ? { ...u, status: "done", progress: 100 } : u
                ));
            } catch (error) {
                setUploads(prev => prev.map((u, idx) =>
                    idx === i ? { ...u, status: "error" } : u
                ));
            }
        }

        onUploadComplete();
    };

    const handleClose = () => {
        setUploads([]);
        onClose();
    };

    const pendingCount = uploads.filter(u => u.status === "pending").length;
    const doneCount = uploads.filter(u => u.status === "done").length;

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Upload size={20} />
                        Upload Files
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Destination */}
                <p className="text-sm text-gray-400 mb-4">
                    Uploading to: <span className="text-gray-300">/{currentPath || "root"}</span>
                </p>

                {/* Drop Zone */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging
                            ? "border-emerald-400 bg-emerald-400/10"
                            : "border-white/20 hover:border-white/40"
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp size={40} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">
                        Drag & drop files here, or <span className="text-emerald-400 cursor-pointer">browse</span>
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                </div>

                {/* File List */}
                {uploads.length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                        {uploads.map((upload, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                            >
                                {upload.status === "done" ? (
                                    <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                                ) : upload.status === "error" ? (
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                                ) : upload.status === "uploading" ? (
                                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                ) : (
                                    <FileUp size={16} className="text-gray-400 flex-shrink-0" />
                                )}
                                <span className="text-sm truncate flex-1">{upload.file.name}</span>
                                <span className="text-xs text-gray-500">
                                    {(upload.file.size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={uploadAll}
                        disabled={pendingCount === 0}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        {doneCount > 0 && pendingCount === 0
                            ? "Done"
                            : `Upload ${pendingCount > 0 ? pendingCount : ""} File${pendingCount !== 1 ? "s" : ""}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
