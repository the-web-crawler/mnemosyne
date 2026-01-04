import { NextRequest, NextResponse } from "next/server";
import { getFile, uploadFile, moveToTrash } from "@/src/lib/s3";

export const dynamic = "force-dynamic";

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

// GET /api/files/path/to/file.txt - Download file
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join("/");

        const { body, contentType, size } = await getFile(filePath);

        if (!body) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return new NextResponse(body, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": size.toString(),
                "Content-Disposition": `inline; filename="${pathSegments[pathSegments.length - 1]}"`,
            },
        });
    } catch (error: any) {
        console.error("[API GET file] Error:", error);
        if (error.name === "NoSuchKey") {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to get file" }, { status: 500 });
    }
}

// PUT /api/files/path/to/file.txt - Upload/overwrite file
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join("/");

        const contentType = request.headers.get("content-type") || "application/octet-stream";

        // Use streaming upload to handle large files better (multipart)
        // and avoid loading entire file into memory
        if (request.body) {
            // Need to convert Web ReadableStream to Node stream or pass directly
            // @aws-sdk/lib-storage handles Web Streams
            const { uploadFileStream } = require("@/src/lib/s3");
            await uploadFileStream(filePath, request.body, contentType);
        } else {
            // Fallback for empty body
            const { uploadFile } = require("@/src/lib/s3");
            await uploadFile(filePath, new Uint8Array(0), contentType);
        }

        return NextResponse.json({ success: true, path: filePath });
    } catch (error: any) {
        console.error("[API PUT file] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
    }
}

// DELETE /api/files/path/to/file.txt - Move to trash
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join("/");

        await moveToTrash(filePath);

        return NextResponse.json({ success: true, path: filePath, trashedAt: Date.now() });
    } catch (error: any) {
        console.error("[API DELETE file] Error:", error);
        if (error.name === "NoSuchKey") {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}

// PATCH /api/files/path/to/file.txt - Update text content
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { path: pathSegments } = await params;
        const filePath = pathSegments.join("/");

        const body = await request.json();
        const content = body.content;

        if (typeof content !== "string") {
            return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
        }

        await uploadFile(filePath, content, "text/plain");

        return NextResponse.json({ success: true, path: filePath });
    } catch (error) {
        console.error("[API PATCH file] Error:", error);
        return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
    }
}
