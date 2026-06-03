import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "./mail";
import { HAUSEVO_LOGO_BASE64 } from "@/lib/assets";
import LoginAlertEmail from "@/emails/LoginAlert";
import React from "react";

// ── Custom adapter — maps NextAuth's `name` field to our `fullName` column ──
function HausevoPrismaAdapter() {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    // Override createUser so `name` → `fullName` and `phoneNumber` is omitted
    async createUser(data: any) {
      const { name, phoneNumber: _phone, ...rest } = data;
      delete rest.image;
      delete rest.emailVerified;
      const user = await prisma.user.create({
        data: {
          ...rest,
          fullName: name ?? rest.fullName ?? "Hausevo User",
        },
      });
      // Return shape must satisfy AdapterUser (needs `name` + `emailVerified`)
      return {
        ...user,
        name: user.fullName,
        emailVerified: null,
      };
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: HausevoPrismaAdapter(),
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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          fullName: profile.name,
          email: profile.email,
          image: profile.picture,
          // phoneNumber is nullable — Google doesn't provide it
        };
      },
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
      // On sign in, attach the user id and name to the token
      if (user) {
        token.id = user.id;
        token.name = user.name;
      } else if (!token.name && token.id) {
        // Fallback: fetch name from DB if missing in token (e.g. after schema changes)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { fullName: true },
        });
        if (dbUser) {
          token.name = dbUser.fullName;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Expose the user id and name on the session object
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      // Only send for Google/OAuth — credentials login is handled in /api/auth/login
      if (account?.provider === "google") {
        try {
          const { renderToStaticMarkup } = require("react-dom/server");

          // NextAuth v5 event callbacks don't expose the request object,
          // so we can't do IP geolocation here. We note the provider and
          // use a locale-neutral UTC time instead.
          const time = new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          });

          const html = `<!DOCTYPE html>${renderToStaticMarkup(
            React.createElement(LoginAlertEmail, {
              name: user.name || user.email || "User",
              device: "Google Account Sign-In",
              location: "Via Google OAuth",
              time,
            })
          )}`;

          await sendEmail({
            to: [{ email: user.email!, name: user.name || undefined }],
            subject: "Security Alert: New login to your Hausevo account",
            html,
            inline_images: [
              {
                cid: "hausevo_logo",
                content: HAUSEVO_LOGO_BASE64,
                mime_type: "image/png",
              },
            ],
          });
        } catch (error) {
          console.error("[AuthEvents] Error sending login alert:", error);
        }
      }
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
});
