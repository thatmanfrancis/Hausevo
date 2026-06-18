import { auth } from "@/lib/auth";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import WaitlistBanner from "@/app/components/WaitlistBanner";
import SplashScreen from "@/app/components/SplashScreen";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <SplashScreen isLoggedIn={!!session?.user} />
      <Navbar session={session} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-10 py-8">
        {children}
      </main>
      <Footer />
      {/* Only show waitlist banner to non-logged-in visitors */}
      {!session?.user && <WaitlistBanner />}
    </div>
  );
}
