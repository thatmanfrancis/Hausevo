import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,

  // JWT is required when using Credentials provider alongside a database adapter.
  // Google OAuth sessions are still stored in the DB via the adapter.
  session: {
    strategy: "jwt",
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            fullName: true,
            passwordHash: true,
            isVerified: true,
            roles: true,
          },
        });

        // No user or no password (e.g. Google-only account)
        if (!user || !user.passwordHash) return null;

        // Email must be verified before login is allowed
        if (!user.isVerified) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth users are automatically verified — Google already confirmed their email
      if (account?.provider !== "credentials" && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        }).catch(() => {
          // User may not exist yet on first OAuth sign-in — adapter creates them after this callback
        });
      }
      return true;
    },

    async jwt({ token, user }) {
      // On sign in, attach the user id to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose the user id on the session object
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
