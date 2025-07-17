import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImpersonationIndicator from "@/components/ImpersonationIndicator";
import OnboardingRedirect from "@/components/auth/OnboardingRedirect";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isImpersonating = session.impersonating?.active || false;

  return (
    <OnboardingRedirect>
      <div className="min-h-screen bg-gray-50 dark:bg-[#141414] flex flex-col">
        <ImpersonationIndicator />
        <div className={isImpersonating ? 'mt-12' : ''}>
          <Navigation />
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </OnboardingRedirect>
  );
}