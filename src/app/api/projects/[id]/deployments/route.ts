import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/deployments - Get deployments
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

        const deployments = await prisma.deployment.findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ deployments });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 });
    }
}

// POST /api/projects/[id]/deployments - Trigger new deployment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get chunkId from request body
    let chunkId: string | null = null;
    try {
        const body = await request.json();
        chunkId = body.chunkId || null;
    } catch {
        // No body provided
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

        // If chunkId provided, check if chunk is already used by another project
        if (chunkId) {
            const chunkInUse = await prisma.project.findFirst({
                where: {
                    chunkId: chunkId,
                    id: { not: id }, // Not this project
                    status: "running", // Only check running projects
                },
            });

            if (chunkInUse) {
                return NextResponse.json(
                    { error: `Chunk is already in use by project "${chunkInUse.name}". One chunk can only be used by one project at a time.` },
                    { status: 400 }
                );
            }

            // Assign chunk to project
            await prisma.project.update({
                where: { id },
                data: { chunkId },
            });
        }

        const lastDeployment = await prisma.deployment.findFirst({
            where: { projectId: id },
            orderBy: { version: "desc" },
        });

        const nextVersion = (lastDeployment?.version || 0) + 1;

        const deployment = await prisma.deployment.create({
            data: {
                projectId: id,
                version: nextVersion,
                status: "pending",
                branch: project.githubBranch || "main",
            },
        });

        // Simulate build process (in real system, this would trigger actual build)
        setTimeout(async () => {
            try {
                await prisma.deployment.update({
                    where: { id: deployment.id },
                    data: {
                        status: "building",
                        buildLogs: "Installing dependencies...\nnpm install\n",
                    },
                });

                setTimeout(async () => {
                    try {
                        await prisma.deployment.update({
                            where: { id: deployment.id },
                            data: {
                                status: "success",
                                duration: Math.floor(Math.random() * 60) + 30,
                                buildLogs:
                                    "Installing dependencies...\nnpm install\n✓ Installed 245 packages\n\nBuilding...\nnpm run build\n✓ Build complete\n\nDeploying...\n✓ Deployed successfully!",
                                url: project.tunnelUrl,
                            },
                        });
                    } catch (e) {
                        console.error("Failed to update deployment:", e);
                    }
                }, 3000);
            } catch (e) {
                console.error("Failed to update deployment:", e);
            }
        }, 1000);

        return NextResponse.json({ deployment });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create deployment" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/deployments?depId=xxx - Delete a deployment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const depId = request.nextUrl.searchParams.get("depId");

    if (!depId) {
        return NextResponse.json({ error: "Deployment ID required" }, { status: 400 });
    }

    try {
        // Verify project belongs to user
        const project = await prisma.project.findFirst({
            where: {
                id,
                user: { email: session.user.email },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Delete the deployment
        await prisma.deployment.delete({
            where: { id: depId },
        });

        return NextResponse.json({ success: true, message: "Deployment deleted" });
    } catch (error) {
        console.error("Delete deployment error:", error);
        return NextResponse.json({ error: "Failed to delete deployment" }, { status: 500 });
    }
}
