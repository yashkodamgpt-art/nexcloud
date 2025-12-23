import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// POST /api/github/webhook - Handle GitHub push webhooks
export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        const event = request.headers.get("x-github-event");

        // Only handle push events
        if (event !== "push") {
            return NextResponse.json({ message: "Ignored non-push event" });
        }

        const body = JSON.parse(payload);
        const repoFullName = body.repository?.full_name;
        const branch = body.ref?.replace("refs/heads/", "");
        const commitSha = body.after;

        if (!repoFullName) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Find project linked to this repo
        const project = await prisma.project.findFirst({
            where: {
                githubRepoName: repoFullName,
                githubBranch: branch,
            },
            include: { chunk: true, user: true },
        });

        if (!project) {
            return NextResponse.json({ message: "No project found for this repo" });
        }

        // Verify webhook signature if secret is set
        if (project.githubWebhookSecret && signature) {
            const hmac = crypto.createHmac("sha256", project.githubWebhookSecret);
            const expectedSignature = "sha256=" + hmac.update(payload).digest("hex");
            if (signature !== expectedSignature) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // Create deployment record
        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                version: (await prisma.deployment.count({ where: { projectId: project.id } })) + 1,
                status: "pending",
            },
        });

        // Update project with latest commit
        await prisma.project.update({
            where: { id: project.id },
            data: {
                githubLastCommit: commitSha,
                status: "deploying",
            },
        });

        // TODO: Send deploy command to HarborFlow via WebSocket/API
        // For now, just log and return success
        console.log(`Deployment triggered for ${project.name}:`, {
            repo: repoFullName,
            branch,
            commit: commitSha,
            deploymentId: deployment.id,
        });

        return NextResponse.json({
            success: true,
            message: "Deployment triggered",
            deploymentId: deployment.id,
            project: project.name,
            commit: commitSha?.substring(0, 7),
        });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
