import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import WaitlistClient from "./WaitlistClient";

export const metadata: Metadata = {
  title: "Join the Waitlist — Shack",
  description:
    "Be among the first to rent or list on Shack — Nigeria's verified property platform. No agents, no markups.",
};

export default async function WaitlistPage() {
  const count = await prisma.launchWaitlist.count();
  return <WaitlistClient count={count} />;
}
