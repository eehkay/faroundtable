'use client'

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Car
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminSidebarCollapsed');
      // Auto-collapse on smaller screens by default
      const isMobile = window.innerWidth < 1024;
      return saved !== null ? saved === 'true' : isMobile;
    }
    return false;
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', newState.toString());
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const saved = localStorage.getItem('adminSidebarCollapsed');
      if (saved === null && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div className={`animate-pulse bg-[#1f1f1f] ${isCollapsed ? 'w-16' : 'w-64'} h-full transition-all duration-200`}></div>
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
      name: "Vehicles",
      href: "/admin/vehicles",
      icon: Car,
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
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#1f1f1f] border-r border-[#2a2a2a] transition-all duration-200 ease-in-out`}>
        <div className="p-4">
          {/* Toggle Button */}
          {!isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
              Collapse Navigation
            </button>
          ) : (
            <div className="relative group mb-6">
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Expand sidebar
              </div>
            </div>
          )}

          {!isCollapsed ? (
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Main Dashboard
            </Link>
          ) : (
            <div className="relative group mb-6">
              <Link 
                href="/dashboard"
                className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Back to Main Dashboard
              </div>
            </div>
          )}
          
          {!isCollapsed && <h2 className="text-lg font-semibold text-white mb-4">Admin Panel</h2>}
          
          <nav className="space-y-1">
            {navigationItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.comingSoon ? '#' : item.href}
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${active 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                      }
                      ${item.comingSoon ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span>{item.name}</span>
                        {item.comingSoon && (
                          <span className="ml-auto text-xs bg-[#2a2a2a] text-gray-500 px-2 py-1 rounded">
                            Soon
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#2a2a2a] text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.name}
                      {item.comingSoon && ' (Soon)'}
                    </div>
                  )}
                </div>
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