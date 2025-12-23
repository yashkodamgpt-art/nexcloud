"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Project {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    githubRepoName: string | null;
    githubBranch: string | null;
    tunnelUrl: string | null;
    createdAt: string;
    deployments: Deployment[];
}

interface Deployment {
    id: string;
    version: string;
    status: string;
    createdAt: string;
}

export default function ProjectDetailPage() {
    const params = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<"frontend" | "backend">("frontend");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProject();
    }, [params.id]);

    async function fetchProject() {
        try {
            const res = await fetch(`/api/projects/${params.id}`);
            const data = await res.json();
            setProject(data.project);
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Project not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-slate-400 hover:text-white">
                                ← Back
                            </Link>
                            <div className="h-6 w-px bg-slate-700" />
                            <h1 className="text-xl font-semibold text-white">{project.name}</h1>
                            {project.githubRepoName && (
                                <span className="text-sm text-slate-500">
                                    📁 {project.githubRepoName}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {project.tunnelUrl && (
                                <a
                                    href={project.tunnelUrl}
                                    target="_blank"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition"
                                >
                                    Visit →
                                </a>
                            )}
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === "running"
                                    ? "bg-green-600/20 text-green-400"
                                    : "bg-slate-600/20 text-slate-400"
                                    }`}
                            >
                                {project.status === "running" ? "● Live" : "○ Stopped"}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4">
                        <button
                            onClick={() => setActiveTab("frontend")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "frontend"
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Frontend
                        </button>
                        <button
                            onClick={() => setActiveTab("backend")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "backend"
                                ? "bg-slate-800 text-white"
                                : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Backend
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === "frontend" ? (
                    <FrontendTab project={project} />
                ) : (
                    <BackendTab project={project} />
                )}
            </main>
        </div>
    );
}

// Frontend Tab (Vercel-like)
function FrontendTab({ project }: { project: Project }) {
    const [deployments, setDeployments] = useState<any[]>([]);
    const [envVars, setEnvVars] = useState<any[]>([]);
    const [chunks, setChunks] = useState<any[]>([]);
    const [selectedChunkId, setSelectedChunkId] = useState<string>("");
    const [deploying, setDeploying] = useState(false);
    const [showEnvForm, setShowEnvForm] = useState(false);
    const [newEnvKey, setNewEnvKey] = useState("");
    const [newEnvValue, setNewEnvValue] = useState("");
    const [selectedDeployment, setSelectedDeployment] = useState<any>(null);

    useEffect(() => {
        fetchDeployments();
        fetchEnvVars();
        fetchChunks();
    }, [project.id]);

    async function fetchDeployments() {
        const res = await fetch(`/api/projects/${project.id}/deployments`);
        const data = await res.json();
        setDeployments(data.deployments || []);
    }

    async function fetchEnvVars() {
        const res = await fetch(`/api/projects/${project.id}/env`);
        const data = await res.json();
        setEnvVars(data.envVariables || []);
    }

    async function fetchChunks() {
        const res = await fetch(`/api/chunks/list`);
        if (res.ok) {
            const data = await res.json();
            setChunks(data.chunks || []);
            // Auto-select first chunk if available
            if (data.chunks?.length > 0 && !selectedChunkId) {
                setSelectedChunkId(data.chunks[0].id);
            }
        }
    }

    async function deleteDeployment(depId: string) {
        if (!confirm("Delete this deployment?")) return;
        await fetch(`/api/projects/${project.id}/deployments?depId=${depId}`, {
            method: "DELETE",
        });
        setDeployments(deployments.filter((d) => d.id !== depId));
    }

    async function triggerDeploy() {
        if (!selectedChunkId && chunks.length > 0) {
            alert("Please select a chunk to deploy to");
            return;
        }
        if (chunks.length === 0) {
            alert("No chunks available! Create a chunk in HarborFlow first.");
            return;
        }
        setDeploying(true);
        const res = await fetch(`/api/projects/${project.id}/deployments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chunkId: selectedChunkId }),
        });
        const data = await res.json();
        if (data.deployment) {
            setDeployments([data.deployment, ...deployments]);
        }
        setTimeout(() => {
            fetchDeployments();
            setDeploying(false);
        }, 5000);
    }

    async function addEnvVar() {
        if (!newEnvKey || !newEnvValue) return;
        const res = await fetch(`/api/projects/${project.id}/env`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: newEnvKey, value: newEnvValue }),
        });
        const data = await res.json();
        if (data.envVariable) {
            setEnvVars([data.envVariable, ...envVars]);
            setNewEnvKey("");
            setNewEnvValue("");
            setShowEnvForm(false);
        }
    }

    async function deleteEnvVar(envId: string) {
        await fetch(`/api/projects/${project.id}/env?envId=${envId}`, {
            method: "DELETE",
        });
        setEnvVars(envVars.filter((v) => v.id !== envId));
    }

    async function deleteProject() {
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                window.location.href = "/dashboard";
            } else {
                alert("Failed to delete project");
            }
        } catch (e) {
            alert("Error deleting project");
        }
    }

    return (
        <div className="space-y-6">
            {/* Deployments */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Deployments</h2>
                    <div className="flex items-center gap-3">
                        {/* Chunk Selector */}
                        <select
                            value={selectedChunkId}
                            onChange={(e) => setSelectedChunkId(e.target.value)}
                            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm"
                        >
                            {chunks.length === 0 ? (
                                <option value="">No chunks available</option>
                            ) : (
                                chunks.map((chunk) => (
                                    <option key={chunk.id} value={chunk.id}>
                                        {chunk.name} ({chunk.diracs}D)
                                    </option>
                                ))
                            )}
                        </select>
                        <button
                            onClick={triggerDeploy}
                            disabled={deploying || chunks.length === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm transition"
                        >
                            {deploying ? "Deploying..." : "Deploy Now"}
                        </button>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {deployments.length > 0 ? (
                        <div className="divide-y divide-slate-800">
                            {deployments.map((dep) => (
                                <div
                                    key={dep.id}
                                    onClick={() => setSelectedDeployment(selectedDeployment?.id === dep.id ? null : dep)}
                                    className="px-6 py-4 hover:bg-slate-800/50 transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`w-2 h-2 rounded-full ${dep.status === "success"
                                                    ? "bg-green-500"
                                                    : dep.status === "building"
                                                        ? "bg-yellow-500 animate-pulse"
                                                        : dep.status === "pending"
                                                            ? "bg-slate-500"
                                                            : "bg-red-500"
                                                    }`}
                                            />
                                            <div>
                                                <div className="text-white font-medium flex items-center gap-2">
                                                    v{dep.version}
                                                    {dep.branch && (
                                                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                                                            {dep.branch}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-slate-500 text-sm">
                                                    {new Date(dep.createdAt).toLocaleString()}
                                                    {dep.duration && ` • ${dep.duration}s`}
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${dep.status === "success"
                                                ? "bg-green-600/20 text-green-400"
                                                : dep.status === "building"
                                                    ? "bg-yellow-600/20 text-yellow-400"
                                                    : "bg-slate-600/20 text-slate-400"
                                                }`}
                                        >
                                            {dep.status}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteDeployment(dep.id); }}
                                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    {/* Build Logs */}
                                    {selectedDeployment?.id === dep.id && dep.buildLogs && (
                                        <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-700">
                                            <div className="text-xs text-slate-400 mb-2">Build Logs</div>
                                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                                {dep.buildLogs}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-12 text-center text-slate-500">
                            No deployments yet. Click "Deploy Now" to start.
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Info */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Framework</div>
                    <div className="text-white font-medium">Next.js</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Branch</div>
                    <div className="text-white font-medium">{project.githubBranch || "main"}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Domain</div>
                    <div className="text-white font-medium truncate">
                        {project.tunnelUrl || `${project.subdomain}.harbor.dev`}
                    </div>
                </div>
            </section>

            {/* Environment Variables */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
                    <button
                        onClick={() => setShowEnvForm(!showEnvForm)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition"
                    >
                        {showEnvForm ? "Cancel" : "+ Add Variable"}
                    </button>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {showEnvForm && (
                        <div className="p-4 border-b border-slate-800 flex gap-3">
                            <input
                                type="text"
                                placeholder="KEY"
                                value={newEnvKey}
                                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none text-sm font-mono"
                            />
                            <input
                                type="text"
                                placeholder="value"
                                value={newEnvValue}
                                onChange={(e) => setNewEnvValue(e.target.value)}
                                className="flex-1 bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none text-sm"
                            />
                            <button
                                onClick={addEnvVar}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition"
                            >
                                Add
                            </button>
                        </div>
                    )}
                    {envVars.length > 0 ? (
                        <div className="divide-y divide-slate-800">
                            {envVars.map((v) => (
                                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <code className="text-blue-400 font-mono text-sm">{v.key}</code>
                                        <code className="text-slate-500 text-sm">{v.value}</code>
                                    </div>
                                    <button
                                        onClick={() => deleteEnvVar(v.id)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-8 text-center text-slate-500 text-sm">
                            {showEnvForm
                                ? "Add your first environment variable above"
                                : "No environment variables configured"}
                        </div>
                    )}
                </div>
            </section>

            {/* Danger Zone */}
            <section className="mt-8">
                <h2 className="text-lg font-semibold text-red-400 mb-4">⚠️ Danger Zone</h2>
                <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium">Delete Project</h3>
                            <p className="text-slate-400 text-sm">Once you delete a project, there is no going back. Please be certain.</p>
                        </div>
                        <button
                            onClick={() => {
                                const confirmName = prompt(`To delete this project, type the project name: "${project.name}"`);
                                if (confirmName === project.name) {
                                    deleteProject();
                                } else if (confirmName !== null) {
                                    alert("Project name doesn't match. Deletion cancelled.");
                                }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition"
                        >
                            Delete Project
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Backend Tab (Supabase-like)
function BackendTab({ project }: { project: Project }) {
    const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 10;");

    return (
        <div className="space-y-6">
            {/* Database Overview */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Database</div>
                    <div className="text-white font-medium">SQLite</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Tables</div>
                    <div className="text-white font-medium">5</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Size</div>
                    <div className="text-white font-medium">2.4 MB</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="text-slate-400 text-sm mb-1">Status</div>
                    <div className="text-green-400 font-medium">● Online</div>
                </div>
            </section>

            {/* Table Browser */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">Tables</h2>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="divide-y divide-slate-800">
                        {["User", "Project", "Chunk", "Deployment", "Account"].map((table) => (
                            <div
                                key={table}
                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400">📋</span>
                                    <span className="text-white">{table}</span>
                                </div>
                                <span className="text-slate-500 text-sm">View →</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SQL Editor */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">SQL Editor</h2>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <textarea
                            value={sqlQuery}
                            onChange={(e) => setSqlQuery(e.target.value)}
                            className="w-full bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none resize-none"
                            rows={4}
                            placeholder="Enter SQL query..."
                        />
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Press Cmd+Enter to run</span>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition">
                            Run Query
                        </button>
                    </div>
                </div>
            </section>

            {/* API Endpoints */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">API Endpoints</h2>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-medium">
                                GET
                            </span>
                            <code className="text-slate-300 text-sm">/api/users</code>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                                POST
                            </span>
                            <code className="text-slate-300 text-sm">/api/users</code>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs font-medium">
                                PUT
                            </span>
                            <code className="text-slate-300 text-sm">/api/users/:id</code>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
