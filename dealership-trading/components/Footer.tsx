'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-[#141414] border-t border-[#2a2a2a] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-[#737373]">
          <p>© {currentYear} roundtable. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ by Del Mar Advertising</p>
        </div>
      </div>
    </footer>
  )
}