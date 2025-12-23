import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Get API key
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { apiKey: true },
                });
                if (dbUser) {
                    (session.user as any).apiKey = dbUser.apiKey;
                }
                // Get GitHub access token from Account
                const githubAccount = await prisma.account.findFirst({
                    where: { userId: user.id, provider: "github" },
                    select: { access_token: true },
                });
                if (githubAccount?.access_token) {
                    (session.user as any).githubToken = githubAccount.access_token;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
