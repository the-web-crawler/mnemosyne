import { NextResponse } from "next/server";
import { getClusterStatus } from "@/src/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const status = await getClusterStatus();
        return NextResponse.json(status);
    } catch (error: any) {
        console.error("[API /status] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch cluster status" },
            { status: 500 }
        );
    }
}
