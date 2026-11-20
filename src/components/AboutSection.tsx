import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Copy, MapPin, Phone, Train } from 'lucide-react';
import { MissionLocationMap } from './MissionLocationMap';
import {
  GREETING_PARAGRAPHS,
  HISTORY_TIMELINE,
  MISSION_ACTIONS,
  MISSION_META,
  VISION_PILLARS,
} from '../data/pgiData';
import {
  buildHistoryTimelineGroups,
  subscribePublishedHistories,
  type FirestoreHistory,
} from '../services/historyService';

export type AboutTab = 'vision' | 'greeting' | 'history' | 'directions';

interface AboutSectionProps {
  requestedTab?: { tab: AboutTab; key: number } | null;
}

export function AboutSection({ requestedTab }: AboutSectionProps) {
  const [activeTab, setActiveTab] = useState<AboutTab>('vision');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [liveHistories, setLiveHistories] = useState<FirestoreHistory[] | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab.tab);
    }
  }, [requestedTab]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(MISSION_META.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      setCopiedAddress(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribePublishedHistories(
      (docs) => {
        setLiveHistories(docs);
      },
      () => {
        setLiveHistories(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const timelineGroups =
    liveHistories === null ? HISTORY_TIMELINE : buildHistoryTimelineGroups(liveHistories);

  const availableYears = timelineGroups.map((g) => g.year);
  const effectiveYear =
    selectedYear !== 'all' && !availableYears.includes(selectedYear) ? 'all' : selectedYear;

  const filteredHistory =
    effectiveYear === 'all'
      ? timelineGroups
      : timelineGroups.filter((item) => item.year === effectiveYear);

  const latestYear = availableYears[0] ?? '2025';
  const earliestYear = availableYears[availableYears.length - 1] ?? '2022';

  return (
    <section id="about" className="py-16 sm:py-24 border-t border-stone-200/80 bg-[#FBF9F5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Section Header + Segmented Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-8 border-b border-stone-200">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
              01. 선교회 소개 · {MISSION_META.affiliation}
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl xl:text-[34px] font-semibold text-[#1C1917] tracking-tight text-balance">
              기도와 예배로 주님의 오심을 준비하는 공동체
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="선교회 소개 하위 메뉴"
            className="inline-flex flex-nowrap items-center gap-1 p-1 bg-[#EBE6DF] rounded-full self-start lg:self-auto shrink-0 max-w-full overflow-x-auto"
          >
            {(
              [
                { id: 'vision', label: '비전 · 사명' },
                { id: 'greeting', label: '공동체 인사말' },
                { id: 'history', label: '걸어온 길 (연혁)' },
                { id: 'directions', label: '오시는 길' },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-2 text-xs sm:text-[13px] font-medium rounded-full transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] ${
                    isActive
                      ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Vision & Mission */}
        {activeTab === 'vision' && (
          <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left 7 cols: Vision Statement */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <p className="text-xs text-[#78716C] mb-2">PGI Vision Statement</p>
                <p className="font-editorial text-xl sm:text-2xl text-[#1C1917] leading-relaxed text-balance">
                  기도와 예배 사역을 통해 신부를 단장하며 성령의 권능으로 이스라엘과 열방의 구속사역을
                  이루어 갑니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VISION_PILLARS.map((pillar) => (
                  <div
                    key={pillar.index}
                    className="p-6 bg-[#F3EFE6]/75 border border-stone-200 rounded-lg"
                  >
                    <p className="font-tabular text-xs font-medium text-[#9A6B22] mb-2">
                      {pillar.index}
                    </p>
                    <h3 className="text-base font-semibold text-[#1C1917] mb-2 leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">{pillar.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: 5 Core Mission Actions */}
            <div className="lg:col-span-5 bg-[#F3EFE6] border border-stone-200 rounded-lg p-6 sm:p-8">
              <div className="pb-4 mb-5 border-b border-stone-200 flex items-baseline justify-between">
                <h3 className="font-editorial text-xl font-semibold text-[#1C1917]">
                  PGI 5대 핵심 사역
                </h3>
                <span className="text-xs text-[#78716C] font-tabular">Core Missions</span>
              </div>

              <ol className="divide-y divide-stone-200">
                {MISSION_ACTIONS.map((action) => (
                  <li key={action.index} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <span className="font-tabular text-xs font-medium text-[#9A6B22] pt-1 shrink-0">
                      {action.index}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917] mb-1">{action.title}</p>
                      <p className="text-sm text-[#57534E] leading-relaxed">{action.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Editorial Greeting */}
        {activeTab === 'greeting' && (
          <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="p-6 bg-[#F3EFE6] border border-stone-200 rounded-lg">
                <p className="text-xs text-[#78716C] mb-2">공동체 인사말</p>
                <h3 className="font-editorial text-xl font-semibold text-[#1C1917] mb-3">
                  Prayer of Golden Incense
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed mb-5">
                  2022년 9월 창립 이후 고난의 연단을 지나 주님의 신부로 단장되어 온 PGI 공동체가
                  한국교회와 열방을 향해 드리는 영적 서신입니다.
                </p>
                <div className="pt-4 border-t border-stone-200 text-xs text-[#57534E] space-y-1">
                  <p>비영리법인 피지아이(PGI)선교회</p>
                  <p>
                    대표 {MISSION_META.representative} · {MISSION_META.affiliation}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 max-w-2xl space-y-12">
              {GREETING_PARAGRAPHS.map((section, idx) => (
                <article key={section.heading} className="space-y-5">
                  <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C1917]">
                    {section.heading}
                  </h3>

                  {section.paragraphs.map((p, pIdx) => (
                    <p
                      key={pIdx}
                      className={`text-[15px] sm:text-base text-[#292524] leading-[1.85] ${
                        idx === 0 && pIdx === 0
                          ? 'first-letter:font-editorial first-letter:text-4xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#9A6B22]'
                          : ''
                      }`}
                    >
                      {p}
                    </p>
                  ))}

                  {/* Hairline-bounded Scripture Pull-Quote (no thick left border) */}
                  <blockquote className="py-5 my-6 border-y border-stone-200">
                    <p className="font-editorial text-base sm:text-lg text-[#1C1917] leading-relaxed mb-2">
                      “{section.scripture.text}”
                    </p>
                    <footer className="text-xs text-[#78716C]">{section.scripture.ref}</footer>
                  </blockquote>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: History Timeline */}
        {activeTab === 'history' && (
          <div className="pt-10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[#57534E] font-tabular">
                {earliestYear}년 설립 발대식부터 {latestYear}년 사역까지의 발자취입니다.
              </p>

              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] rounded-full">
                {['all', ...availableYears].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 cursor-pointer font-tabular whitespace-nowrap shrink-0 ${
                      effectiveYear === year
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {year === 'all' ? '전체 연혁' : `${year}년`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {filteredHistory.map((group) => (
                <div
                  key={group.year}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 pt-6 border-t border-stone-200"
                >
                  <div className="md:col-span-3">
                    <h3 className="font-editorial text-3xl font-semibold text-[#1C1917] font-tabular">
                      {group.year}
                    </h3>
                  </div>

                  <div className="md:col-span-9 divide-y divide-stone-200/80">
                    {group.events.map((ev, idx) => (
                      <div
                        key={`${group.year}-${ev.date}-${ev.title}-${idx}`}
                        className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6"
                      >
                        <span className="font-tabular text-xs text-[#9A6B22] w-36 shrink-0">
                          {ev.date}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm sm:text-base font-medium text-[#1C1917]">
                            {ev.title}
                          </span>
                          {ev.location && (
                            <span className="text-xs text-[#78716C] ml-2">· {ev.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Directions & Location */}
        {activeTab === 'directions' && (
          <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left 5 Cols: Center Info & Address Copy */}
            <div className="lg:col-span-5 bg-[#F3EFE6] border border-stone-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-medium text-[#9A6B22] mb-1.5">수원 PGI 선교회 센터</p>
                <h3 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-2">
                  수원 빛과소금교회 2층 본당
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  화요 정기예배와 목요 기도회, 기도 말씀 컨퍼런스 및 청청캠프가 열리는 선교회
                  본부 예배 처소입니다.
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 space-y-3">
                <p className="text-xs text-[#78716C] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#9A6B22]" />
                  <span>도로명 주소 (우편번호 {MISSION_META.postalCode})</span>
                </p>
                <p className="text-sm sm:text-base font-medium text-[#1C1917]">
                  {MISSION_META.address}
                </p>

                <MissionLocationMap />

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-stone-300 hover:border-[#1C1917] rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#9A6B22]" />
                        <span>주소가 복사되었습니다</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#57534E]" />
                        <span>도로명 주소 복사</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      MISSION_META.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#57534E] bg-[#FBF9F5] border border-stone-300 hover:border-[#1C1917] hover:text-[#1C1917] rounded-full transition-all duration-300 whitespace-nowrap"
                  >
                    <span>Google 지도 열기</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-4">
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

            {/* Right 7 Cols: Public Transit & Visit Notes */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 bg-[#FBF9F5] border border-stone-200 rounded-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <p className="text-sm font-semibold text-[#1C1917] flex items-center gap-2">
                    <Train className="w-4 h-4 text-[#9A6B22]" />
                    <span>대중교통 오시는 길</span>
                  </p>
                  <span className="text-xs text-[#78716C]">정류장 · 권선2동성당</span>
                </div>

                <ul className="divide-y divide-stone-200/80 text-sm text-[#44403C]">
                  <li className="py-3.5 first:pt-0">
                    <p className="font-semibold text-[#1C1917] mb-1">1호선 · 수인분당선 수원역</p>
                    <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                      92번 버스 승차 (약 30분 소요) → 권선2동성당 정류장 하차 후 도보 5분
                    </p>
                  </li>
                  <li className="py-3.5">
                    <p className="font-semibold text-[#1C1917] mb-1">1호선 세류역</p>
                    <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                      하차 후 공원길 따라 도보 약 20분 (택시 이용 시 기본요금 수준 약 5,000원)
                    </p>
                  </li>
                  <li className="py-3.5 last:pb-0">
                    <p className="font-semibold text-[#1C1917] mb-1">수원 고속·시외버스터미널</p>
                    <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                      터미널 길 건너 80번 버스 승차 → 권선2동성당 정류장 하차 후 도보 5분
                    </p>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#9A6B22]">정기 예배 및 방문 안내</p>
                  <p className="text-sm text-[#292524]">
                    화요 정기예배(오전 10:30 / 오후 1:30) 및 목요 기도회 방문 전 문의가 필요하신가요?
                  </p>
                </div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-full transition-all duration-300 ease-out whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <span>사역 · 방문 문의</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
