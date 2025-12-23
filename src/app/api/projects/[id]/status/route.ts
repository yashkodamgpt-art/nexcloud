import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// PATCH /api/projects/[id]/status - Update project deployment status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const apiKey = request.headers.get("x-api-key");
        const body = await request.json();
        const { status, errorMessage } = body;

        if (!apiKey) {
            return NextResponse.json(
                { error: "API key required" },
                { status: 401, headers: corsHeaders }
            );
        }

        // Verify user owns this project
        const user = await prisma.user.findUnique({
            where: { apiKey },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid API key" },
                { status: 401, headers: corsHeaders }
            );
        }

        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project || project.userId !== user.id) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Update status
        const updated = await prisma.project.update({
            where: { id },
            data: {
                status: status || project.status,
                // Store error message in a field if needed
            },
        });

        return NextResponse.json({
            success: true,
            project: {
                id: updated.id,
                name: updated.name,
                status: updated.status,
            }
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Status update error:", error);
        return NextResponse.json(
            { error: "Failed to update status" },
            { status: 500, headers: corsHeaders }
        );
    }
}
