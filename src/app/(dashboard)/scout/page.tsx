import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ScoutClient from "./ScoutClient";

export default async function ScoutPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  return <ScoutClient />;
}
