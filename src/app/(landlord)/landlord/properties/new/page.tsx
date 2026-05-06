import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewPropertyClient from "./NewPropertyClient";

export default async function NewPropertyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  return <NewPropertyClient />;
}
