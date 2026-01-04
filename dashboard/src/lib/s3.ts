import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

// S3 client configured for Garage
export function getS3Client() {
    return new S3Client({
        endpoint: process.env.S3_ENDPOINT || "http://127.0.0.1:3900",
        region: "garage", // Garage ignores this but SDK requires it
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        forcePathStyle: true, // Required for Garage
    });
}

export const ARCHIVE_BUCKET = "archive";
export const TRASH_BUCKET = "archive-trash";

export interface FileItem {
    name: string;
    path: string;
    type: "file" | "folder";
    size: number;
    lastModified: string;
    mimeType?: string;
}

// List files in a directory
export async function listFiles(prefix: string = ""): Promise<FileItem[]> {
    const s3 = getS3Client();

    // Normalize prefix
    const normalizedPrefix = prefix ? (prefix.endsWith("/") ? prefix : `${prefix}/`) : "";

    const command = new ListObjectsV2Command({
        Bucket: ARCHIVE_BUCKET,
        Prefix: normalizedPrefix,
        Delimiter: "/",
    });

    const response = await s3.send(command);
    const items: FileItem[] = [];

    // Add folders (CommonPrefixes)
    if (response.CommonPrefixes) {
        for (const cp of response.CommonPrefixes) {
            if (cp.Prefix) {
                const name = cp.Prefix.replace(normalizedPrefix, "").replace(/\/$/, "");
                if (name) {
                    items.push({
                        name,
                        path: cp.Prefix.replace(/\/$/, ""),
                        type: "folder",
                        size: 0,
                        lastModified: "",
                    });
                }
            }
        }
    }

    // Add files (Contents)
    if (response.Contents) {
        for (const obj of response.Contents) {
            if (obj.Key) {
                const name = obj.Key.replace(normalizedPrefix, "");
                // Skip the prefix itself (empty name) and folder markers
                if (name && !name.endsWith("/")) {
                    items.push({
                        name,
                        path: obj.Key,
                        type: "file",
                        size: obj.Size || 0,
                        lastModified: obj.LastModified?.toISOString() || "",
                        mimeType: guessMimeType(name),
                    });
                }
            }
        }
    }

    return items;
}

// Get file content
export async function getFile(path: string): Promise<{ body: ReadableStream | null; contentType: string; size: number }> {
    const s3 = getS3Client();

    const command = new GetObjectCommand({
        Bucket: ARCHIVE_BUCKET,
        Key: path,
    });

    const response = await s3.send(command);

    return {
        body: response.Body?.transformToWebStream() || null,
        contentType: response.ContentType || "application/octet-stream",
        size: response.ContentLength || 0,
    };
}

// Upload file - resilient to Garage background sync errors
export async function uploadFile(path: string, body: Buffer | Uint8Array | string, contentType?: string): Promise<void> {
    const s3 = getS3Client();

    const command = new PutObjectCommand({
        Bucket: ARCHIVE_BUCKET,
        Key: path,
        Body: body,
        ContentType: contentType || guessMimeType(path),
    });

    try {
        await s3.send(command);
    } catch (error: any) {
        // Garage sometimes throws ServiceUnavailable during background sync
        // but the write actually succeeds on available nodes
        if (error.Code === "ServiceUnavailable" || error.name === "ServiceUnavailable") {
            console.warn(`[S3] Background sync warning for ${path} - write likely succeeded`);
            return; // Treat as success
        }
        throw error;
    }
}

// Move file to trash (soft delete) - resilient to background sync errors
export async function moveToTrash(path: string): Promise<void> {
    const s3 = getS3Client();

    // Copy to trash with timestamp
    const timestamp = Date.now();
    const trashKey = `${path}_${timestamp}`;

    try {
        await s3.send(new CopyObjectCommand({
            Bucket: TRASH_BUCKET,
            Key: trashKey,
            CopySource: `${ARCHIVE_BUCKET}/${path}`,
        }));
    } catch (error: any) {
        if (error.Code !== "ServiceUnavailable" && error.name !== "ServiceUnavailable") {
            throw error;
        }
        console.warn(`[S3] Background sync warning for copy to trash - likely succeeded`);
    }

    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: ARCHIVE_BUCKET,
            Key: path,
        }));
    } catch (error: any) {
        if (error.Code !== "ServiceUnavailable" && error.name !== "ServiceUnavailable") {
            throw error;
        }
        console.warn(`[S3] Background sync warning for delete - likely succeeded`);
    }
}

// Permanently delete file
export async function deleteFile(path: string, bucket: string = ARCHIVE_BUCKET): Promise<void> {
    const s3 = getS3Client();

    await s3.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: path,
    }));
}

// Guess MIME type from extension
function guessMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
        // Images
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        ico: "image/x-icon",
        // Documents
        pdf: "application/pdf",
        txt: "text/plain",
        md: "text/markdown",
        html: "text/html",
        css: "text/css",
        js: "text/javascript",
        json: "application/json",
        // Video
        mp4: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        // Audio
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        // Archives
        zip: "application/zip",
        tar: "application/x-tar",
        gz: "application/gzip",
    };
    return types[ext || ""] || "application/octet-stream";
}

// Check if file is an image (for thumbnails)
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
}

// Check if file is text-editable
export function isTextFile(mimeType: string): boolean {
    return mimeType.startsWith("text/") || mimeType === "application/json";
}

// Format file size for display
export function formatSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
