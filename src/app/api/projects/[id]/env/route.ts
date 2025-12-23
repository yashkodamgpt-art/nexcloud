import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/env - Get environment variables
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const project = await prisma.project.findFirst({
            where: {
                id,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const envVariables = await prisma.envVariable.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
        });

        // Mask values for security
        const maskedVars = envVariables.map((v) => ({
            id: v.id,
            key: v.key,
            value: "••••••••",
            target: v.target,
            createdAt: v.createdAt,
        }));

        return NextResponse.json({ envVariables: maskedVars });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch env variables" }, { status: 500 });
    }
}

// POST /api/projects/[id]/env - Add environment variable
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { key, value, target = "all" } = body;

    if (!key || !value) {
        return NextResponse.json({ error: "Key and value required" }, { status: 400 });
    }

    try {
        const project = await prisma.project.findFirst({
            where: {
                id,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const envVar = await prisma.envVariable.create({
            data: {
                projectId: id,
                key,
                value,
                target,
            },
        });

        return NextResponse.json({
            envVariable: {
                id: envVar.id,
                key: envVar.key,
                value: "••••••••",
                target: envVar.target,
            },
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Variable already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create env variable" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/env - Delete environment variable
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const envId = searchParams.get("envId");

    if (!envId) {
        return NextResponse.json({ error: "envId required" }, { status: 400 });
    }

    try {
        await prisma.envVariable.delete({
            where: { id: envId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
