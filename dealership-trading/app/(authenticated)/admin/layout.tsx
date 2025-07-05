'use client'

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { isAdmin, isManager } from "@/lib/permissions";
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  TruckIcon, 
  Mail, 
  Settings, 
  FileText, 
  Activity,
  ChevronLeft
} from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !isAdmin(session.user.role) && !isManager(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen">
        <div className="animate-pulse bg-[#1f1f1f] w-64 h-full"></div>
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#2a2a2a] rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || (!isAdmin(session.user.role) && !isManager(session.user.role))) {
    return null;
  }

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      show: true
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      show: isAdmin(session.user.role)
    },
    {
      name: "Dealerships",
      href: "/admin/dealerships",
      icon: Building2,
      show: isAdmin(session.user.role)
    },
    {
      name: "Transfers",
      href: "/admin/transfers",
      icon: TruckIcon,
      show: true
    },
    {
      name: "Notifications",
      href: "/admin/notifications",
      icon: Mail,
      show: isAdmin(session.user.role)
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      show: isAdmin(session.user.role),
      comingSoon: true
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: FileText,
      show: true,
      comingSoon: true
    },
    {
      name: "Activity Logs",
      href: "/admin/activity",
      icon: Activity,
      show: isAdmin(session.user.role),
      comingSoon: true
    }
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1f1f1f] border-r border-[#2a2a2a]">
        <div className="p-4">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Main Dashboard
          </Link>
          
          <h2 className="text-lg font-semibold text-white mb-4">Admin Panel</h2>
          
          <nav className="space-y-1">
            {navigationItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.comingSoon ? '#' : item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                    }
                    ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.comingSoon && (
                    <span className="ml-auto text-xs bg-[#2a2a2a] text-gray-500 px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <AdminBreadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}