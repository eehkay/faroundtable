'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Car, MapPin, FileText, TrendingUp } from 'lucide-react';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const subNavItems = [
    {
      href: '/analytics',
      label: 'Overview',
      icon: BarChart3,
      exact: true,
    },
    {
      href: '/analytics/market-trend-report',
      label: 'Market Trends',
      icon: TrendingUp,
      exact: false,
    },
    {
      href: '/analytics/regional',
      label: 'Regional',
      icon: MapPin,
      exact: false,
    },
    {
      href: '/analytics/reports',
      label: 'Reports',
      icon: FileText,
      exact: false,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation */}
      <div className="bg-[#141414] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    inline-flex items-center px-1 pt-4 pb-3 border-b-2 text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'border-[#3b82f6] text-[#3b82f6]' 
                      : 'border-transparent text-[#a3a3a3] hover:text-white hover:border-[#333333]'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}