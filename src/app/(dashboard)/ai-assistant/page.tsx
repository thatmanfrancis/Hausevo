import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AIAssistantClient from "./AIAssistantClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant — Hausevo",
  description: "Your personal housing advisor, powered by Google Gemini.",
};

export default async function AIAssistantPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          AI Assistant
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Hausevo AI</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Powered by Google Gemini. Knows your account, tenancy, and the Lagos market.
        </p>
      </div>

      <AIAssistantClient userName={session.user.name ?? "there"} />
    </div>
  );
}
