import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react';

interface GalleryPresentationProps {
  albumKey: string | number;
  title: string;
  dateLabel?: string;
  images: string[];
  initialIndex?: number;
  variant?: 'inline' | 'modal';
  enableKeyboard?: boolean;
  onOpenFullscreen?: (currentIndex: number) => void;
}

export function GalleryPresentation({
  albumKey,
  title,
  dateLabel,
  images,
  initialIndex = 0,
  variant = 'inline',
  enableKeyboard = false,
  onOpenFullscreen,
}: GalleryPresentationProps) {
  const total = images.length;
  const safeInitial = total > 0 ? Math.min(Math.max(0, initialIndex), total - 1) : 0;

  const [currentIndex, setCurrentIndex] = useState(safeInitial);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCurrentIndex(safeInitial);
    setFailedIndices({});
    setIsPlaying(false);
  }, [albumKey, safeInitial]);

  useEffect(() => {
    if (!isPlaying || total <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isPlaying, total]);

  useEffect(() => {
    if (!enableKeyboard || total <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % total);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, total]);

  if (total === 0) {
    return (
      <div className="w-full h-64 sm:h-80 rounded-xl bg-[#EBE6DF] border border-stone-200 flex flex-col items-center justify-center gap-2 text-[#78716C]">
        <ImageIcon className="w-8 h-8" />
        <span className="text-xs">등록된 사진이 없습니다.</span>
      </div>
    );
  }

  const goPrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const currentSrc = images[currentIndex];
  const isCurrentBroken = Boolean(failedIndices[currentIndex]);
  const stageHeightClass =
    variant === 'modal'
      ? 'h-[300px] sm:h-[440px] lg:h-[500px]'
      : 'h-[280px] sm:h-[400px] lg:h-[460px]';

  return (
    <div className="bg-[#161412] text-[#FBF9F5] rounded-xl overflow-hidden border border-stone-800 shadow-sm">
      {/* Top Presentation Toolbar */}
      <div className="px-4 sm:px-5 py-3 bg-[#1E1B18] border-b border-stone-800/90 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="font-medium text-[#D6A656]">프레젠테이션</span>
            {dateLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-tabular truncate">{dateLabel}</span>
              </>
            )}
          </div>
          <p className="text-sm sm:text-base font-medium text-[#FBF9F5] truncate mt-0.5">
            {title}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 text-xs font-tabular text-stone-200 bg-stone-800/90 rounded">
            {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsPlaying((v) => !v)}
              aria-label={isPlaying ? '자동 슬라이드 일시정지' : '자동 슬라이드 재생'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-100 bg-stone-800 hover:bg-stone-700 rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#D6A656]" />
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#D6A656]" />
                  <span>슬라이드 재생</span>
                </>
              )}
            </button>
          )}

          {onOpenFullscreen && (
            <button
              type="button"
              onClick={() => onOpenFullscreen(currentIndex)}
              aria-label="전체 화면 프레젠테이션 열기"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] hover:bg-[#FBF9F5] rounded transition-colors cursor-pointer whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">크게 보기</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Viewport */}
      <div className={`relative w-full ${stageHeightClass} bg-[#100F0D] flex items-center justify-center`}>
        {!isCurrentBroken ? (
          <img
            key={`${albumKey}-${currentIndex}`}
            src={currentSrc}
            alt={`${title} (${currentIndex + 1}/${total})`}
            referrerPolicy="no-referrer"
            onError={() => setFailedIndices((prev) => ({ ...prev, [currentIndex]: true }))}
            className="w-full h-full object-contain select-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-stone-400">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">이미지를 불러올 수 없습니다.</span>
          </div>
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="이전 사진"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1917]/75 hover:bg-[#1C1917] border border-stone-700/80 text-[#FBF9F5] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A656]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="다음 사진"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1C1917]/75 hover:bg-[#1C1917] border border-stone-700/80 text-[#FBF9F5] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6A656]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Progress Dots + Thumbnail Filmstrip */}
      {total > 1 && (
        <div className="px-4 py-3 bg-[#1E1B18] border-t border-stone-800/90 space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {images.map((src, idx) => {
              const isSelected = idx === currentIndex;
              const isBroken = Boolean(failedIndices[idx]);
              return (
                <button
                  key={`${albumKey}-thumb-${idx}`}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(idx);
                  }}
                  aria-label={`${idx + 1}번째 사진 보기`}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D6A656] ring-2 ring-[#D6A656]/70 opacity-100'
                      : 'border-stone-700 opacity-60 hover:opacity-95'
                  }`}
                >
                  {!isBroken ? (
                    <img
                      src={src}
                      alt={`${title} 썸네일 ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedIndices((prev) => ({ ...prev, [idx]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-500">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-1 px-1 text-[10px] font-tabular font-medium bg-[#161412]/85 text-stone-200 rounded">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
