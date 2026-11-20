import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Image as ImageIcon, MapPin, Maximize2, Phone, Pin } from 'lucide-react';
import {
  GALLERY_BASELINE_ITEMS,
  getNoticeImages,
  MISSION_META,
  normalizeCommunityCategory,
  NOTICES,
  type CommunityCategory,
  type NoticeItem,
} from '../data/pgiData';
import { subscribePublishedNotices } from '../services/noticeService';
import {
  createInquiry,
  INQUIRY_CONSTRAINTS,
  validateInquiryInput,
} from '../services/inquiryService';
import { GalleryPresentation } from './GalleryPresentation';

interface NoticesAndContactSectionProps {
  onSelectNotice: (notice: NoticeItem, initialSlideIndex?: number) => void;
  onOpenDirections: () => void;
  preselectedTopic: string;
}

const COMMUNITY_CATEGORIES: CommunityCategory[] = ['공지', '갤러리'];

export function NoticesAndContactSection({
  onSelectNotice,
  onOpenDirections,
  preselectedTopic,
}: NoticesAndContactSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<CommunityCategory>('공지');
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  // Live Firestore Community Posts
  const [livePosts, setLivePosts] = useState<NoticeItem[] | null>(null);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = subscribePublishedNotices(
      (docs) => {
        if (docs.length === 0) {
          setLivePosts([]);
          return;
        }
        const mapped: NoticeItem[] = docs.map((d) => ({
          id: d.id,
          category: normalizeCommunityCategory(d.category),
          title: d.title,
          dateLabel: d.dateLabel,
          summary: d.summary,
          body: d.content
            .split(/\n{2,}|\n/)
            .map((line) => line.trim())
            .filter(Boolean),
          imageUrl: d.imageUrl || d.imageUrls[0] || undefined,
          imageUrls: d.imageUrls,
          isPinned: d.isPinned,
          authorName: d.authorName,
        }));
        setLivePosts(mapped);
      },
      () => {
        // Fallback smoothly to baseline items if read fails
        setLivePosts(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Inquiry Form State
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [topic, setTopic] = useState(preselectedTopic || '화요예배 및 방문 문의');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    topic: string;
  } | null>(null);

  useEffect(() => {
    if (preselectedTopic) {
      setTopic(preselectedTopic);
      setSubmittedData(null);
    }
  }, [preselectedTopic]);

  const liveNoticeItems =
    livePosts?.filter((p) => normalizeCommunityCategory(p.category) === '공지') ?? [];
  const liveGalleryItems =
    livePosts?.filter((p) => normalizeCommunityCategory(p.category) === '갤러리') ?? [];

  const activeNotices: NoticeItem[] = liveNoticeItems.length > 0 ? liveNoticeItems : NOTICES;
  const activeGalleries: NoticeItem[] =
    liveGalleryItems.length > 0 ? liveGalleryItems : GALLERY_BASELINE_ITEMS;
  const activePresentation: NoticeItem | undefined =
    activeGalleries.find((g) => String(g.id) === String(selectedGalleryId)) ?? activeGalleries[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      topic,
      message: message.trim(),
    };

    const validationError = validateInquiryInput(payload);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      await createInquiry(payload);
      setSubmittedData({ name: payload.name, topic: payload.topic });
      setName('');
      setContact('');
      setMessage('');
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : '문의 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <section id="community" className="py-16 sm:py-24 border-t border-stone-200 bg-[#FBF9F5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 space-y-20">
        {/* Part A: Community (공지 · 갤러리) */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-stone-200">
            <div>
              <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
                05. 커뮤니티 · PGI Community
              </p>
              <h2 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#1C1917] tracking-tight">
                커뮤니티 소식 및 사역 갤러리
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="커뮤니티 카테고리 선택"
              className="inline-flex items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg self-start lg:self-auto"
            >
              {COMMUNITY_CATEGORIES.map((cat) => {
                const isActive = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category 1: 공지 */}
          {categoryFilter === '공지' && (
            <div className="divide-y divide-stone-200 border-b border-stone-200">
              {activeNotices.length === 0 ? (
                <p className="py-10 text-sm text-[#78716C] text-center">
                  등록된 공지사항이 없습니다.
                </p>
              ) : (
                activeNotices.map((notice) => {
                  const noticeKey = String(notice.id);
                  const showThumb = Boolean(notice.imageUrl) && !failedThumbIds[noticeKey];

                  return (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => onSelectNotice(notice)}
                      className="w-full py-5 px-2 text-left hover:bg-[#F3EFE6]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {showThumb && (
                          <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-md overflow-hidden border border-stone-200 bg-[#F3EFE6] shrink-0">
                            <img
                              src={notice.imageUrl}
                              alt={notice.title}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedThumbIds((prev) => ({ ...prev, [noticeKey]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-[#78716C]">
                            {notice.isPinned && (
                              <>
                                <span className="inline-flex items-center gap-1 font-medium text-[#9A6B22]">
                                  <Pin className="w-3 h-3" />
                                  중요
                                </span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span className="font-medium text-[#9A6B22]">공지</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-tabular">{notice.dateLabel}</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-medium text-[#1C1917] group-hover:text-[#9A6B22] transition-colors">
                            {notice.title}
                          </h3>
                          <p className="text-sm text-[#57534E] line-clamp-1">{notice.summary}</p>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-[#57534E] group-hover:text-[#1C1917] shrink-0 whitespace-nowrap">
                        자세히 보기 →
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Category 2: 갤러리 (Presentation Stage + Album Selector) */}
          {categoryFilter === '갤러리' && (
            <div className="pt-8 space-y-8">
              {activeGalleries.length === 0 || !activePresentation ? (
                <p className="py-10 text-sm text-[#78716C] text-center">
                  등록된 갤러리 게시물이 없습니다.
                </p>
              ) : (
                <>
                  {/* Featured Presentation Viewer */}
                  <div className="space-y-4">
                    <GalleryPresentation
                      albumKey={activePresentation.id}
                      title={activePresentation.title}
                      dateLabel={activePresentation.dateLabel}
                      images={getNoticeImages(activePresentation)}
                      variant="inline"
                      onOpenFullscreen={(slideIdx) =>
                        onSelectNotice(activePresentation, slideIdx)
                      }
                    />

                    <div className="p-5 sm:p-6 bg-[#F3EFE6]/70 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                          <span className="font-medium text-[#9A6B22]">선택된 앨범</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-tabular">{activePresentation.dateLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-tabular">
                            사진 {getNoticeImages(activePresentation).length}장
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-[#292524] leading-relaxed">
                          {activePresentation.summary || activePresentation.body[0]}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectNotice(activePresentation, 0)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>전체 화면 프레젠테이션</span>
                      </button>
                    </div>
                  </div>

                  {/* Album Selector Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span className="font-medium text-[#57534E]">사역 갤러리 앨범 목록</span>
                      <span className="font-tabular">총 {activeGalleries.length}개 앨범</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {activeGalleries.map((item) => {
                        const itemKey = String(item.id);
                        const itemImages = getNoticeImages(item);
                        const coverSrc = itemImages[0];
                        const hasPhoto = Boolean(coverSrc) && !failedThumbIds[itemKey];
                        const isSelectedAlbum =
                          String(activePresentation.id) === itemKey;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl overflow-hidden border transition-colors flex flex-col ${
                              isSelectedAlbum
                                ? 'bg-[#F3EFE6] border-[#9A6B22] ring-1 ring-[#9A6B22]'
                                : 'bg-[#F3EFE6]/55 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedGalleryId(itemKey)}
                              className="text-left cursor-pointer group flex-1 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
                            >
                              <div className="w-full aspect-[4/3] bg-[#EBE6DF] overflow-hidden relative">
                                {hasPhoto ? (
                                  <img
                                    src={coverSrc}
                                    alt={item.title}
                                    referrerPolicy="no-referrer"
                                    onError={() =>
                                      setFailedThumbIds((prev) => ({ ...prev, [itemKey]: true }))
                                    }
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#78716C]">
                                    <ImageIcon className="w-7 h-7" />
                                    <span className="text-xs">사역 갤러리</span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-xs text-[#78716C]">
                                    <span className="font-medium text-[#9A6B22]">
                                      {isSelectedAlbum ? '상영 중' : '갤러리'}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-tabular">{item.dateLabel}</span>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-tabular">사진 {itemImages.length}장</span>
                                  </div>
                                  <h3 className="text-base font-semibold text-[#1C1917] group-hover:text-[#9A6B22] transition-colors leading-snug">
                                    {item.title}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-[#57534E] line-clamp-2 leading-relaxed">
                                    {item.summary}
                                  </p>
                                </div>
                              </div>
                            </button>

                            <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => setSelectedGalleryId(itemKey)}
                                className="font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                              >
                                {isSelectedAlbum ? '현재 화면에서 재생 중' : '프레젠테이션으로 보기'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectNotice(item, 0)}
                                className="inline-flex items-center gap-1 font-medium text-[#9A6B22] hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>크게 보기</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Part B: Ministry & Training Contact Inquiry */}
        <div
          id="contact"
          className="pt-12 border-t border-stone-200 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start"
        >
          {/* Left 5 Cols: Inquiry Summary & Quick Link to Directions */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
                06. 사역 및 훈련 문의
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] tracking-tight mb-3">
                PGI 선교회 사무국 안내
              </h2>
              <p className="text-sm text-[#57534E] leading-relaxed">
                화요 정기예배, 기도 말씀 컨퍼런스, 제자스쿨, 청청캠프 참여 및 중보기도 관련
                궁금한 사항을 편하게 문의해 주세요.
              </p>
            </div>

            <div className="p-6 bg-[#F3EFE6] border border-stone-200 rounded-xl space-y-4">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-[#9A6B22] mt-0.5 shrink-0" />
                <div className="space-y-1.5">
                  <p className="text-xs text-[#78716C]">수원 PGI 선교회 센터</p>
                  <p className="text-sm font-medium text-[#1C1917]">{MISSION_META.address}</p>
                  <button
                    type="button"
                    onClick={onOpenDirections}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#9A6B22] hover:underline cursor-pointer"
                  >
                    <span>선교회 소개 · 오시는 길 보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs text-[#78716C] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#9A6B22]" />
                  <span>사무국 전화 문의</span>
                </span>
                <a
                  href="tel:031-224-2885"
                  className="font-tabular text-sm font-semibold text-[#1C1917] hover:text-[#9A6B22]"
                >
                  {MISSION_META.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Validated Inquiry & Prayer Request Form */}
          <div className="lg:col-span-7 bg-[#F3EFE6]/55 border border-stone-200 rounded-xl p-6 sm:p-8">
            <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1917] mb-2">
              훈련 신청 및 사역 문의
            </h3>
            <p className="text-sm text-[#57534E] mb-6">
              기도 말씀 컨퍼런스, 제자스쿨, 청청캠프 등록이나 중보기도 및 예배 방문 관련 문의를
              남겨주시면 사무국에서 안내해 드립니다.
            </p>

            {submittedData ? (
              <div
                role="status"
                className="p-6 bg-[#FBF9F5] border border-stone-200 rounded-lg space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
                  <Check className="w-4 h-4 text-[#9A6B22]" />
                  <span>문의가 정상적으로 접수되었습니다</span>
                </div>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  <strong className="text-[#1C1917]">{submittedData.name}</strong>님, 요청하신{' '}
                  <strong className="text-[#1C1917]">[{submittedData.topic}]</strong> 문의가
                  사무국에 정상적으로 등록되었습니다. 관리자 확인 후 남겨주신 연락처로 신속히
                  회신드리겠습니다. 긴급한 안내는 사무국({MISSION_META.phone})으로 전화 주시기
                  바랍니다.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedData(null)}
                  className="text-xs font-medium text-[#9A6B22] underline underline-offset-4 cursor-pointer"
                >
                  추가 문의 작성하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block text-xs font-medium text-[#292524] mb-1.5"
                    >
                      성함 / 소속
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      maxLength={INQUIRY_CONSTRAINTS.NAME_MAX}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 홍길동 (빛과소금교회)"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A6B22] focus:ring-1 focus:ring-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-contact"
                      className="block text-xs font-medium text-[#292524] mb-1.5"
                    >
                      연락처 (전화번호 또는 이메일)
                    </label>
                    <input
                      id="inquiry-contact"
                      type="text"
                      maxLength={INQUIRY_CONSTRAINTS.CONTACT_MAX}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="예: 010-1234-5678"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A6B22] focus:ring-1 focus:ring-[#9A6B22]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-topic"
                    className="block text-xs font-medium text-[#292524] mb-1.5"
                  >
                    문의 구분
                  </label>
                  <select
                    id="inquiry-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22] focus:ring-1 focus:ring-[#9A6B22]"
                  >
                    <option value="화요예배 및 방문 문의">화요예배 및 방문 문의</option>
                    <option value="PGI 기도 말씀 컨퍼런스">PGI 기도 말씀 컨퍼런스</option>
                    <option value="Disciple School (제자스쿨)">Disciple School (제자스쿨)</option>
                    <option value="청년 · 청소년 청청캠프">청년 · 청소년 청청캠프</option>
                    <option value="열방 단기선교 및 미주지부">열방 단기선교 및 미주지부</option>
                    <option value="기타 중보기도 및 후원 문의">기타 중보기도 및 후원 문의</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="block text-xs font-medium text-[#292524] mb-1.5"
                  >
                    문의 내용
                  </label>
                  <textarea
                    id="inquiry-message"
                    rows={4}
                    maxLength={INQUIRY_CONSTRAINTS.MESSAGE_MAX}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="참여 희망 과정, 인원, 또는 궁금하신 사항을 자유롭게 남겨주세요."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A6B22] focus:ring-1 focus:ring-[#9A6B22] resize-y"
                  />
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-[#9A3412]">
                    {formError}
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-[#78716C]">전화 직접 상담: {MISSION_META.phone}</p>
                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="px-6 py-2.5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
                  >
                    {isSubmittingInquiry ? '접수 중...' : '문의 접수하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
