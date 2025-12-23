import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/chunks/list - List current user's chunks (session-based)
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const chunks = await prisma.chunk.findMany({
            where: {
                userId: session.user.id,
                type: "chunk", // Only real chunks, not pods
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            chunks: chunks.map((chunk) => ({
                id: chunk.id,
                name: chunk.name,
                status: chunk.status,
                diracs: chunk.diracs,
                dc: chunk.dc,
                dm: chunk.dm,
                ds: chunk.ds,
                db: chunk.db,
            })),
        });
    } catch (error) {
        console.error("Chunk list error:", error);
        return NextResponse.json(
            { error: "Failed to list chunks" },
            { status: 500 }
        );
    }
}
