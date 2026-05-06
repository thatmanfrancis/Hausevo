import { redirect } from "next/navigation";

// Landlord chat reuses the same chat page as tenants
export default function LandlordChatPage() {
  redirect("/chat");
}
