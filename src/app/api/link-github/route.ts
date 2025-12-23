import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// Redirect to GitHub OAuth to link account
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        // Not logged in, redirect to regular login
        redirect("/api/auth/signin/github");
    }

    // Already logged in - redirect to GitHub OAuth
    // This will trigger the allowDangerousEmailAccountLinking flow
    const params = new URLSearchParams({
        callbackUrl: "/projects/new",
    });

    redirect(`/api/auth/signin/github?${params.toString()}`);
}
