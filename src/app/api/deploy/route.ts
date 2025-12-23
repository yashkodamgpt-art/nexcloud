import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/deploy - IDE sends code for deployment
export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get("x-api-key");

        if (!apiKey) {
            return NextResponse.json(
                { error: "API key required in x-api-key header" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { apiKey },
            include: { chunks: { where: { status: "online" } } },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid API key" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { projectName, subdomain, framework, chunkId } = body;

        if (!projectName || !subdomain) {
            return NextResponse.json(
                { error: "projectName and subdomain are required" },
                { status: 400 }
            );
        }

        // Check if subdomain is available
        const existingProject = await prisma.project.findUnique({
            where: { subdomain },
        });

        if (existingProject && existingProject.userId !== user.id) {
            return NextResponse.json(
                { error: "Subdomain already taken" },
                { status: 409 }
            );
        }

        // Select chunk (use provided or first available)
        let targetChunkId = chunkId;
        if (!targetChunkId && user.chunks.length > 0) {
            targetChunkId = user.chunks[0].id;
        }

        // Create or update project
        const project = await prisma.project.upsert({
            where: { subdomain },
            update: {
                name: projectName,
                framework: framework || null,
                chunkId: targetChunkId,
                status: "deploying",
            },
            create: {
                name: projectName,
                subdomain,
                userId: user.id,
                framework: framework || null,
                chunkId: targetChunkId,
                status: "deploying",
            },
        });

        // Create deployment record
        const lastDeployment = await prisma.deployment.findFirst({
            where: { projectId: project.id },
            orderBy: { version: "desc" },
        });

        const newVersion = (lastDeployment?.version || 0) + 1;

        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                version: newVersion,
                status: "pending",
            },
        });

        // In a real implementation, we would:
        // 1. Store the code in Brain Chunk (S3/R2)
        // 2. Notify the target chunk via WebSocket to pull and deploy
        // For now, we simulate success

        // Update deployment and project status
        await prisma.deployment.update({
            where: { id: deployment.id },
            data: { status: "live" },
        });

        await prisma.project.update({
            where: { id: project.id },
            data: { status: "running" },
        });

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                url: `https://${subdomain}.harbor.dev`,
                status: "running",
            },
            deployment: {
                id: deployment.id,
                version: newVersion,
            },
        });
    } catch (error) {
        console.error("Deploy error:", error);
        return NextResponse.json(
            { error: "Deployment failed" },
            { status: 500 }
        );
    }
}

// GET /api/deploy - Get deployment status
export async function GET(request: NextRequest) {
    try {
        const apiKey = request.headers.get("x-api-key");
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!apiKey) {
            return NextResponse.json(
                { error: "API key required" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { apiKey },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid API key" },
                { status: 401 }
            );
        }

        if (projectId) {
            const project = await prisma.project.findFirst({
                where: { id: projectId, userId: user.id },
                include: { deployments: { orderBy: { version: "desc" }, take: 5 } },
            });

            if (!project) {
                return NextResponse.json(
                    { error: "Project not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json({ project });
        }

        // List all projects
        const projects = await prisma.project.findMany({
            where: { userId: user.id },
            include: { chunk: true },
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Get deploy error:", error);
        return NextResponse.json(
            { error: "Failed to get deployment info" },
            { status: 500 }
        );
    }
}
