import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/github/repos - List user's GitHub repositories
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubToken = (session.user as any).githubToken;

    if (!githubToken) {
        return NextResponse.json({
            error: "GitHub not connected",
            connectUrl: "/api/auth/signin/github"
        }, { status: 400 });
    }

    try {
        // Fetch repos from GitHub API
        const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();

        // Map to simpler format
        const repoList = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            defaultBranch: repo.default_branch,
            cloneUrl: repo.clone_url,
            htmlUrl: repo.html_url,
            updatedAt: repo.updated_at,
        }));

        return NextResponse.json({ repos: repoList });
    } catch (error: any) {
        console.error("GitHub repos error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
