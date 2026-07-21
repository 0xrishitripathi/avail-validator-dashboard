'use client';

export function Header() {
  return (
    <header className="border-b border-[#2a2a2a] bg-[#0d0d0d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/Dark%20Horizontal.svg" 
              alt="Avail" 
              className="w-24 sm:w-[120px] h-auto"
            />
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a 
              href="https://www.availproject.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Website
            </a>
            <a 
              href="https://avail.subscan.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Explorer
            </a>
            <a 
              href="https://docs.availproject.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Docs
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
