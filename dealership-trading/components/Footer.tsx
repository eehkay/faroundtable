'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-[#141414] border-t border-[#2a2a2a] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-[#737373]">
          <p>© {currentYear} roundtable. All rights reserved.</p>
          <div className="mt-3 space-x-4">
            <Link href="/terms" className="hover:text-[#a3a3a3] transition-colors duration-200">
              Terms of Service
            </Link>
            <span className="text-[#525252]">•</span>
            <Link href="/privacy" className="hover:text-[#a3a3a3] transition-colors duration-200">
              Privacy Policy
            </Link>
          </div>
          <p className="mt-3">Made with ❤️ by Del Mar Advertising</p>
        </div>
      </div>
    </footer>
  )
}