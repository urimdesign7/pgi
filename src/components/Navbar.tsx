import { useState } from 'react';
import { Menu, Settings, X } from 'lucide-react';
import { YOUTUBE_CHANNEL_URL } from '../data/pgiData';

interface NavbarProps {
  onOpenAdminPage: () => void;
}

const NAV_LINKS = [
  { href: '#about', label: '선교회 소개' },
  { href: '#ministry', label: '예배 · 사역' },
  { href: '#training', label: '훈련 · 캠프' },
  { href: '#torah', label: '토라포션' },
  { href: '#community', label: '커뮤니티' },
];

function YouTubeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
        fill="#FF0000"
      />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#FFFFFF" />
    </svg>
  );
}

export function Navbar({ onOpenAdminPage }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-200/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#top"
          className="font-editorial text-lg font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] rounded-sm"
        >
          PGI 선교회
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="주요 메뉴"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-1 hover:text-[#1C1917] transition-colors duration-150 whitespace-nowrap shrink-0 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-px after:bg-[#9A6B22] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-150 after:origin-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Red YouTube Channel Icon + Admin Page Icon + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PGI 선교회 유튜브 채널 바로가기"
            title="유튜브 PGI 선교회 채널"
            className="inline-flex items-center justify-center w-10 h-10 hover:bg-[#EBE6DF]/70 rounded-full transition-all duration-300 hover:opacity-90 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
          >
            <YouTubeIcon className="w-6 h-6" />
          </a>

          <button
            type="button"
            onClick={onOpenAdminPage}
            aria-label="관리자 페이지"
            title="관리자 페이지"
            className="inline-flex items-center justify-center w-10 h-10 text-[#1C1917] bg-[#EBE6DF]/80 hover:bg-[#E2DCD2] rounded-full transition-all duration-300 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-[#1C1917] hover:bg-[#EBE6DF] rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FBF9F5] px-4 py-4 space-y-1">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-3 text-sm font-medium text-[#292524] hover:bg-[#F3EFE6] rounded-md transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-2">
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] hover:bg-[#EBE6DF] border border-stone-300 rounded-full transition-all duration-300 whitespace-nowrap"
            >
              <YouTubeIcon className="w-4 h-4" />
              <span>유튜브 채널</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenAdminPage();
              }}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>관리자 페이지</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
