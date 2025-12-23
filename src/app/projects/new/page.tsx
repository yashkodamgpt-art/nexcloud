"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Repo {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    defaultBranch: string;
    cloneUrl: string;
    htmlUrl: string;
    updatedAt: string;
}

export default function NewProjectPage() {
    const router = useRouter();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [projectName, setProjectName] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [branch, setBranch] = useState("main");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchRepos();
    }, []);

    async function fetchRepos() {
        try {
            const res = await fetch("/api/github/repos");
            const data = await res.json();

            if (data.error) {
                if (data.connectUrl) {
                    // GitHub not connected, redirect to connect
                    setError("Please connect your GitHub account first");
                } else {
                    setError(data.error);
                }
                setLoading(false);
                return;
            }

            setRepos(data.repos || []);
            setLoading(false);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    }

    function selectRepo(repo: Repo) {
        setSelectedRepo(repo);
        setProjectName(repo.name);
        setSubdomain(repo.name.toLowerCase().replace(/[^a-z0-9]/g, "-"));
        setBranch(repo.defaultBranch);
    }

    async function createProject() {
        if (!selectedRepo || !projectName || !subdomain) return;

        setCreating(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName,
                    subdomain: subdomain,
                    githubRepoUrl: selectedRepo.cloneUrl,
                    githubRepoName: selectedRepo.fullName,
                    githubBranch: branch,
                }),
            });

            const data = await res.json();
            if (data.error) {
                setError(data.error);
                setCreating(false);
                return;
            }

            router.push("/dashboard");
        } catch (e: any) {
            setError(e.message);
            setCreating(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <nav className="flex items-center justify-between p-6 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-2xl">⚓</span>
                    <span className="text-xl font-bold text-white">Harbor</span>
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold text-white mb-2">Deploy from GitHub</h1>
                <p className="text-slate-400 mb-8">
                    Select a repository to deploy. We'll clone and run it on your device.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
                        {error}
                        {error.includes("connect") && (
                            <a
                                href="/api/auth/signin/github?callbackUrl=/projects/new"
                                className="block mt-2 text-blue-400 underline"
                            >
                                Connect GitHub →
                            </a>
                        )}
                    </div>
                )}

                {!selectedRepo ? (
                    <>
                        <h2 className="text-lg font-semibold text-white mb-4">Your Repositories</h2>

                        {loading ? (
                            <div className="text-slate-400">Loading repositories...</div>
                        ) : (
                            <div className="grid gap-3">
                                {repos.map((repo) => (
                                    <button
                                        key={repo.id}
                                        onClick={() => selectRepo(repo)}
                                        className="w-full text-left bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">📁</span>
                                                <div>
                                                    <div className="text-white font-medium">{repo.name}</div>
                                                    <div className="text-slate-500 text-sm">{repo.fullName}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {repo.private && (
                                                    <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                                                        Private
                                                    </span>
                                                )}
                                                <span className="text-slate-500 text-sm">{repo.defaultBranch}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {repos.length === 0 && !loading && (
                                    <div className="text-slate-400 text-center py-8">
                                        No repositories found. Make sure your GitHub account has some repos.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                            <span className="text-2xl">📁</span>
                            <div>
                                <div className="text-white font-semibold">{selectedRepo.fullName}</div>
                                <button
                                    onClick={() => setSelectedRepo(null)}
                                    className="text-blue-400 text-sm hover:underline"
                                >
                                    Change repository
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Subdomain</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={subdomain}
                                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                    <span className="text-slate-500">.harbor.dev</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Branch</label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={createProject}
                                disabled={creating || !projectName || !subdomain}
                                className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition"
                            >
                                {creating ? "Creating..." : "Create Project & Deploy"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}
