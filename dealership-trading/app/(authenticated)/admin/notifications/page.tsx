'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAdmin } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Filter, BarChart3, Activity, ArrowRight, Mail, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-[#2a2a2a] rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin(session.user.role)) {
    return null;
  }

  const navigationCards = [
    {
      title: "Settings",
      description: "Configure global email settings and sender information",
      icon: Settings,
      href: "/admin/notifications/settings",
      color: "bg-gray-600",
      stats: "From address, footer, compliance settings"
    },
    {
      title: "Templates",
      description: "Create and manage notification templates for email and SMS",
      icon: FileText,
      href: "/admin/notifications/templates",
      color: "bg-blue-600",
      stats: "Email & SMS templates with merge tags"
    },
    {
      title: "Rules",
      description: "Configure who receives notifications and when",
      icon: Filter,
      href: "/admin/notifications/rules",
      color: "bg-indigo-600",
      stats: "Condition-based recipient targeting"
    },
    {
      title: "Analytics",
      description: "Monitor notification performance and delivery metrics",
      icon: BarChart3,
      href: "/admin/notifications/analytics",
      color: "bg-purple-600",
      stats: "Delivery rates, open rates, and trends"
    },
    {
      title: "Activity Log",
      description: "Track all notification delivery attempts and status",
      icon: Activity,
      href: "/admin/notifications/activity",
      color: "bg-green-600",
      stats: "Real-time delivery tracking"
    }
  ];

  const features = [
    {
      icon: Mail,
      title: "Multi-Channel Support",
      description: "Send notifications via email and SMS with channel-specific templates"
    },
    {
      icon: MessageSquare,
      title: "Smart Targeting",
      description: "Use rules to automatically determine recipients based on conditions"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Notification System</h1>
        <p className="mt-2 text-gray-400">
          Manage templates, configure rules, and monitor notification delivery
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:border-gray-700 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-500" />
                  </div>
                  <CardTitle className="mt-4">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{card.stats}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex gap-4 p-4 border border-gray-800 rounded-lg">
                <div className="flex-shrink-0">
                  <Icon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-t border-gray-800 pt-6">
        <p className="text-sm text-gray-500">
          Need help? Check out the{" "}
          <Link href="/docs/NOTIFICATION_TEMPLATE_VARIABLES.md" className="text-blue-500 hover:underline">
            template variables reference
          </Link>{" "}
          or view the{" "}
          <Link href="/docs/NOTIFICATION_SYSTEM_ROADMAP.md" className="text-blue-500 hover:underline">
            system roadmap
          </Link>.
        </p>
      </div>
    </div>
  );
}