import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/projects - List user's projects
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
        where: { userId: session.user.id },
        include: { chunk: true, deployments: { take: 5, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, subdomain, githubRepoUrl, githubRepoName, githubBranch } = body;

        if (!name || !subdomain) {
            return NextResponse.json({ error: "Name and subdomain are required" }, { status: 400 });
        }

        // Check if subdomain is taken
        const existing = await prisma.project.findUnique({
            where: { subdomain },
        });

        if (existing) {
            return NextResponse.json({ error: "Subdomain already taken" }, { status: 400 });
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name,
                subdomain,
                userId: session.user.id!,
                githubRepoUrl,
                githubRepoName,
                githubBranch: githubBranch || "main",
                status: "stopped",
            },
        });

        return NextResponse.json({ success: true, project });
    } catch (error: any) {
        console.error("Create project error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
