'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function AdminBreadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumb on admin dashboard
  if (pathname === '/admin') {
    return null;
  }

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    
    // Format segment name
    let name = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Handle special cases
    switch (segment) {
      case 'admin':
        name = 'Admin Dashboard';
        break;
      case 'users':
        name = 'User Management';
        break;
      case 'transfers':
        name = 'Transfer Management';
        break;
      case 'notifications':
        name = 'Notification Settings';
        break;
    }
    
    return { name, href, isLast: index === pathSegments.length - 1 };
  });

  return (
    <nav className="mb-6">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500 mx-2" />}
            {item.isLast ? (
              <span className="text-gray-400 font-medium">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}