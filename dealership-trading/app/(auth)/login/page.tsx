"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import TechnicalBackground from "@/components/auth/TechnicalBackground"
import GoogleIcon from "@/components/icons/GoogleIcon"
import { AlertCircle } from "lucide-react"
import { Suspense } from "react"
import Image from "next/image"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      {/* Animated Background */}
      <TechnicalBackground />
      
      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <Image
                src="https://vchtbaawxxruwtvebxlg.supabase.co/storage/v1/object/public/logos/roundtable-logo-stacked.png"
                alt="Round Table Logo"
                width={200}
                height={200}
                className="mx-auto"
                priority
              />
            </div>
            <p className="text-sm text-[#a3a3a3]">
              Dealership Inventory Trading and Analytics System
            </p>
            <p className="text-lg text-[#3b82f6] font-medium mb-2">
              Connect • Trade • Analyze • Succeed
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-400">
                  {error === "auth" && "Authentication failed. Please use your @delmaradv.com or @formanautomotive.com email."}
                  {error === "Configuration" && "There is a problem with the server configuration."}
                  {error === "AccessDenied" && "Access denied. Your account may not have permission."}
                  {error === "Verification" && "The sign in link is no longer valid."}
                </div>
              </div>
            </div>
          )}

          {/* Sign In Section */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-[#737373] mb-6">
                Sign in with your authorized Google account
              </p>
            </div>

            {/* Google Sign In Button */}
            <div className="flex justify-center">
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center justify-center space-x-3 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
              >
                <GoogleIcon className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2a2a]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-[#1f1f1f] text-[#737373]">Authorized domains</span>
              </div>
            </div>

            {/* Authorized Domains */}
            <div className="text-center">
              <p className="text-xs text-[#737373]">
                @delmaradv.com • @formanautomotive.com
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-3 pb-8">
          <p className="text-xs text-[#737373]">
            © {new Date().getFullYear()} Round Table. All rights reserved.
          </p>
          <div className="space-x-4">
            <a href="/terms" className="text-xs text-[#737373] hover:text-[#a3a3a3] transition-colors duration-200">
              Terms of Service
            </a>
            <span className="text-xs text-[#525252]">•</span>
            <a href="/privacy" className="text-xs text-[#737373] hover:text-[#a3a3a3] transition-colors duration-200">
              Privacy Policy
            </a>
          </div>
          <p className="text-xs text-[#737373]">
            Made with ❤️ by Del Mar Advertising
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  )
}