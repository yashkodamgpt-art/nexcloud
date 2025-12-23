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
        }),
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
            checks: ["none"], // Disable PKCE to avoid cookie issues
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Allow sign in if no account linking needed
            if (!user.email) return true;

            // Check if user exists with this email
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            // If user exists, link this account to existing user
            if (existingUser && account) {
                const existingAccount = await prisma.account.findFirst({
                    where: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                });

                // Only link if this provider account doesn't exist
                if (!existingAccount) {
                    await prisma.account.create({
                        data: {
                            userId: existingUser.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                        },
                    });
                }
            }

            return true;
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Get API key and GitHub token
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
