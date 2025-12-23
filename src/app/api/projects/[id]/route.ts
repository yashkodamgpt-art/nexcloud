import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/projects/[id]/deploy - Update project with tunnel URL
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { tunnelUrl, status, chunkId } = body;

        // Validate API key
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey) {
            return NextResponse.json({ error: "API key required" }, { status: 401 });
        }

        // Find user by API key
        const user = await prisma.user.findUnique({
            where: { apiKey },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        // Update project
        const project = await prisma.project.update({
            where: { id, userId: user.id },
            data: {
                tunnelUrl: tunnelUrl || undefined,
                status: status || undefined,
                chunkId: chunkId || undefined,
            },
        });

        return NextResponse.json({ success: true, project });
    } catch (error: any) {
        console.error("Deploy update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/projects/[id] - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: { chunk: true, deployments: { take: 10, orderBy: { createdAt: "desc" } } },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/projects/[id] - Delete project and all related data
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // First, delete all deployments
        await prisma.deployment.deleteMany({
            where: { projectId: id },
        });

        // Delete all env variables
        await prisma.envVariable.deleteMany({
            where: { projectId: id },
        });

        // Delete the project
        await prisma.project.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Project deleted" });
    } catch (error: any) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
