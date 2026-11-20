import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { HERO_SLIDES } from '../data/pgiData';

interface HeroSectionProps {
  onOpenLiveModal: () => void;
}

const ROTATION_INTERVAL_MS = 3000;

export function HeroSection({ onOpenLiveModal }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const activeSlide = HERO_SLIDES[activeIndex];

  return (
    <section id="top" className="relative bg-[#FBF9F5]">
      {/* Full-Bleed Large Upper Viewport Hero Visual Carrier */}
      <div
        className="relative w-full h-[70vh] min-h-[520px] sm:h-[78vh] sm:min-h-[600px] lg:h-[84vh] lg:max-h-[840px] overflow-hidden bg-[#1C1917]"
        aria-roledescription="carousel"
        aria-label="PGI 선교회 대표 실사 이미지 슬라이드"
      >
        {/* Crossfading 3-Image Stack (compositor opacity only) */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          const hasFailed = failedImages[slide.id];

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ease-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {hasFailed ? (
                <div
                  className="w-full h-full bg-[#241E19]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 25%, rgba(231,211,172,0.18), transparent 60%)',
                  }}
                />
              ) : (
                <img
                  src={slide.image}
                  alt={slide.alt}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [slide.id]: true }))
                  }
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}

        {/* Measured Contrast Scrim (>= 4.5:1 text legibility) */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-t from-[#12100E]/90 via-[#12100E]/48 to-[#12100E]/20 pointer-events-none"
          aria-hidden="true"
        />

        {/* Hero Content Overlay Aligned to 1200px Container */}
        <div className="relative z-20 h-full max-w-[1200px] mx-auto px-4 sm:px-8 pb-10 sm:pb-14 lg:pb-16 flex flex-col justify-end">
          <div className="max-w-3xl">
            <p className="font-latin-serif text-sm sm:text-base tracking-wider text-[#E7D3AC] mb-3">
              {activeSlide.kicker}
            </p>

            <h1
              className="font-editorial font-semibold text-[#FBF9F5] leading-[1.26] tracking-tight text-balance mb-4"
              style={{ fontSize: 'clamp(1.85rem, 4vw, 3.6rem)' }}
            >
              복음 증거와 예배로
              <br className="hidden sm:inline" /> 분향단의 기도를 채워 나가는 사명 공동체
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-200/95 leading-relaxed max-w-2xl mb-7 sm:mb-8">
              “예루살렘을 위하여 평안을 구하라 예루살렘을 사랑하는 자는 형통하리로다”
              <span className="hidden sm:inline"> — {activeSlide.caption}</span>
            </p>
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#FBF9F5]/15">
            <div className="flex flex-wrap items-center gap-5 pt-2">
              <button
                type="button"
                onClick={onOpenLiveModal}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#1C1917] bg-[#E7D3AC] hover:bg-[#F2E3C4] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7D3AC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1917]"
              >
                <Radio className="w-4 h-4" />
                <span>화요예배 및 생중계 안내</span>
              </button>

              <a
                href="#about"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FBF9F5] hover:text-[#E7D3AC] transition-colors duration-150 whitespace-nowrap shrink-0 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7D3AC] rounded-sm"
              >
                <span>선교회 비전 · 인사말 보기</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Editorial Slide Rotation Controls (01 / 02 / 03 + Prev/Next) */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5" role="tablist" aria-label="슬라이드 선택">
                {HERO_SLIDES.map((slide, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`${index + 1}번째 실사 이미지: ${slide.caption}`}
                      onClick={() => setActiveIndex(index)}
                      className="group py-2 px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7D3AC] rounded-sm"
                    >
                      <span
                        className={`block h-0.5 transition-all duration-200 ${
                          isActive
                            ? 'w-7 bg-[#E7D3AC]'
                            : 'w-4 bg-[#FBF9F5]/40 group-hover:bg-[#FBF9F5]/75'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="font-tabular text-xs text-stone-300 select-none">
                0{activeIndex + 1} / 0{HERO_SLIDES.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="이전 이미지"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[#FBF9F5]/25 bg-[#1C1917]/45 text-[#FBF9F5] hover:bg-[#1C1917]/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7D3AC]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="다음 이미지"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-[#FBF9F5]/25 bg-[#1C1917]/45 text-[#FBF9F5] hover:bg-[#1C1917]/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7D3AC]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column Operational Utility Ribbon */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-stone-200 bg-[#F3EFE6]/70 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
          <div className="px-5 py-4">
            <p className="text-xs text-[#78716C] mb-1">화요 정기예배</p>
            <p className="text-sm font-medium text-[#1C1917] font-tabular">
              매주 화 10:30 / 13:30
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-[#78716C] mb-1">목요 정기 기도회</p>
            <p className="text-sm font-medium text-[#1C1917] font-tabular">
              매주 목 10:30
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-[#78716C] mb-1">주요 양육 · 훈련</p>
            <p className="text-sm font-medium text-[#1C1917]">
              기도컨퍼런스 · 제자스쿨 · 청청캠프
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-[#78716C] mb-1">지부안내</p>
            <p className="text-sm font-medium text-[#1C1917]">
              <a href="#domestic-chapters" className="hover:text-[#9A6B22] transition-colors">
                국내지부
              </a>
              <span aria-hidden="true" className="mx-1.5 text-stone-400">
                ·
              </span>
              <a href="#north-america" className="hover:text-[#9A6B22] transition-colors">
                미주지부
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
