"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Car, TruckIcon, LayoutDashboard, ChevronDown, LogOut, User, Shield, Moon, Sun, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { canViewAllTransfers, canManageUsers, isAdmin, isManager } from '@/lib/permissions'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [imageError, setImageError] = useState(false)
  const { theme, setTheme } = useTheme()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      href: '/inventory',
      label: 'Inventory',
      icon: Car,
      show: true
    },
    {
      href: '/transfers',
      label: 'Transfers',
      icon: TruckIcon,
      show: true
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: true
    },
    {
      href: '/admin',
      label: 'Admin',
      icon: Shield,
      show: session ? (isAdmin(session.user.role) || isManager(session.user.role)) : false
    }
  ]

  if (!session) return null

  const userInitials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || session.user.email?.[0].toUpperCase()

  return (
    <nav className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#2a2a2a] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="https://vchtbaawxxruwtvebxlg.supabase.co/storage/v1/object/public/branding/roundtable_logo.png"
                  alt="Round Table Logo"
                  width={150}
                  height={50}
                  className="h-10 w-auto"
                  priority
                  quality={100}
                />
              </Link>
            </div>

            {/* Main navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.filter(item => item.show).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative ml-3 h-auto p-0">
                  <div className="flex items-center gap-2 px-3 py-2">
                    {session.user.image && !imageError ? (
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={session.user.name || ''}
                        width={32}
                        height={32}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        {userInitials}
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{session.user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.role}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {session.user.role}
                      </span>
                    </p>
                    {session.user.location && (
                      <p className="text-xs text-muted-foreground">
                        {session.user.location.name}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>

                {(isAdmin(session.user.role) || isManager(session.user.role)) && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  Toggle Theme
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}