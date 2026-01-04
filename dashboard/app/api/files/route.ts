import { NextRequest, NextResponse } from "next/server";
import { listFiles } from "@/src/lib/s3";

export const dynamic = "force-dynamic";

// GET /api/files?path=some/folder
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const path = searchParams.get("path") || "";

        const files = await listFiles(path);

        return NextResponse.json({
            path,
            files,
        });
    } catch (error) {
        console.error("[API /files] Error:", error);
        return NextResponse.json(
            { error: "Failed to list files" },
            { status: 500 }
        );
    }
}
