import { useEffect, useState } from 'react';
import { ArrowUpRight, Calendar, Maximize2, Minimize2, MapPin, Play, X } from 'lucide-react';
import {
  getNoticeImages,
  MISSION_META,
  normalizeCommunityCategory,
  YOUTUBE_LIVE_URL,
  type NoticeItem,
} from '../data/pgiData';
import { GalleryPresentation } from './GalleryPresentation';

interface LiveWorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveWorshipModal({ isOpen, onClose }: LiveWorshipModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F5] border border-stone-200 rounded-xl p-6 sm:p-8 shadow-xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-[#9A6B22] mb-1">
              Prayer of Golden Incense
            </p>
            <h3 id="live-modal-title" className="font-editorial text-2xl font-semibold text-[#1C1917]">
              PGI 화요예배 및 유튜브 생중계
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#57534E] hover:bg-[#EBE6DF] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#44403C] leading-relaxed">
          매주 화요일 토라포션을 배우고 나누며 분향단의 기도를 드리는 PGI 화요예배는 현장 예배와
          함께 공식 유튜브 채널로 실시간 생중계됩니다.
        </p>

        <dl className="space-y-3 p-4 bg-[#F3EFE6] border border-stone-200 rounded-lg text-sm">
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#9A6B22] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#78716C]">정기 예배 시간</dt>
              <dd className="font-medium text-[#1C1917] font-tabular">
                매주 화요일 오전 10:30 / 오후 1:30
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#9A6B22] mt-0.5 shrink-0" />
            <div>
              <dt className="text-xs text-[#78716C]">현장 예배 장소</dt>
              <dd className="font-medium text-[#1C1917]">{MISSION_META.address}</dd>
            </div>
          </div>
        </dl>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-[#57534E] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
          >
            닫기
          </button>
          <a
            href={YOUTUBE_LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4" />
            <span>유튜브 생중계 채널 열기</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  initialSlideIndex?: number;
  onClose: () => void;
}

export function NoticeDetailModal({
  notice,
  initialSlideIndex = 0,
  onClose,
}: NoticeDetailModalProps) {
  const [expandedImage, setExpandedImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setExpandedImage(false);
    setImageError(false);
  }, [notice?.id]);

  useEffect(() => {
    if (!notice) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [notice, onClose]);

  if (!notice) return null;

  const images = getNoticeImages(notice);
  const normalizedCategory = normalizeCommunityCategory(notice.category);
  const isPresentation = normalizedCategory === '갤러리' || images.length > 1;
  const singleImage = images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={onClose}
    >
      <div
        className={`w-full ${
          isPresentation ? 'max-w-4xl' : 'max-w-xl'
        } max-h-[90vh] bg-[#FBF9F5] border border-stone-200 rounded-xl p-6 sm:p-8 shadow-xl flex flex-col gap-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#78716C] mb-1.5">
              <span className="font-medium text-[#9A6B22]">{normalizedCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-tabular">{notice.dateLabel}</span>
              {images.length > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-tabular">사진 {images.length}장</span>
                </>
              )}
            </div>
            <h3 id="notice-modal-title" className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1917]">
              {notice.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#57534E] hover:bg-[#EBE6DF] hover:text-[#1C1917] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1">
          {isPresentation ? (
            <GalleryPresentation
              albumKey={notice.id}
              title={notice.title}
              dateLabel={notice.dateLabel}
              images={images}
              initialIndex={initialSlideIndex}
              variant="modal"
              enableKeyboard={true}
            />
          ) : (
            <>
              {singleImage && !imageError && (
                <div className="bg-[#F3EFE6] border border-stone-200 rounded-lg overflow-hidden">
                  <img
                    src={singleImage}
                    alt={notice.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className={`w-full object-contain mx-auto transition-all ${
                      expandedImage ? 'max-h-none' : 'max-h-[380px]'
                    }`}
                  />
                  <div className="px-3 py-2 border-t border-stone-200 bg-[#FBF9F5] flex items-center justify-between text-xs text-[#78716C]">
                    <span>첨부 이미지</span>
                    <button
                      type="button"
                      onClick={() => setExpandedImage((v) => !v)}
                      className="inline-flex items-center gap-1 font-medium text-[#9A6B22] hover:underline cursor-pointer"
                    >
                      {expandedImage ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>기본 크기로 보기</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>크게 보기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {singleImage && imageError && (
                <div className="p-4 bg-[#F3EFE6] border border-stone-200 rounded-lg text-xs text-[#78716C] text-center">
                  첨부된 이미지를 불러올 수 없습니다.
                </div>
              )}
            </>
          )}

          <div className="space-y-3 text-sm sm:text-base text-[#292524] leading-relaxed">
            {notice.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-[#78716C] shrink-0">
          <span>
            {notice.authorName ? `${notice.authorName} · ` : ''}문의: {MISSION_META.phone}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
