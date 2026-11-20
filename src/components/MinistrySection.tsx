import { ArrowUpRight, Globe, MapPin, Play } from 'lucide-react';
import {
  DOMESTIC_CHAPTERS,
  MISSION_META,
  MISSION_REGIONS,
  NORTH_AMERICA_CHAPTER,
  SITE_IMAGES,
  YOUTUBE_LIVE_URL,
} from '../data/pgiData';
import { ResilientImage } from './ResilientImage';

interface MinistrySectionProps {
  onOpenLiveModal: () => void;
}

export function MinistrySection({ onOpenLiveModal }: MinistrySectionProps) {
  return (
    <section id="ministry" className="py-16 sm:py-24 border-t border-stone-200 bg-[#F3EFE6]/45">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
            02. 예배 및 열방 사역
          </p>
          <h2 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#1C1917] tracking-tight text-balance mb-3">
            화요예배에서 열방의 현장과 북미주까지
          </h2>
          <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
            매주 화요일 토라포션을 배우며 분향단의 기도를 올려드리고, 이스라엘과 중동·중앙아시아·북미주
            공동체가 한마음으로 주님의 구속사를 섬깁니다.
          </p>
        </div>

        {/* Asymmetric Bento Row 1: Tuesday Worship (7 cols) + Global Missions (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Tuesday Worship Card */}
          <article className="lg:col-span-7 bg-[#FBF9F5] border border-stone-200 rounded-xl overflow-hidden flex flex-col">
            <ResilientImage
              src={SITE_IMAGES.worship}
              alt="수원 빛과소금교회 2층 본당에서 드려지는 PGI 화요예배"
              aspectClassName="aspect-[16/10]"
              fallbackLabel="PGI 화요예배 · 매주 화요일 10:30 / 13:30"
            />
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C] mb-2">
                  <span>정기 예배</span>
                  <span aria-hidden="true">·</span>
                  <span>토라포션 강해 및 중보기도</span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-3">
                  PGI 화요예배
                </h3>
                <p className="text-sm sm:text-base text-[#57534E] leading-relaxed mb-5">
                  매주 화요일 예배를 통해 토라포션을 배우고 나누며, 기도와 예배를 통해 신부를 단장하고
                  성령의 권능으로 이스라엘과 열방의 구속사역을 이루어 갑니다.
                </p>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 text-sm">
                  <div>
                    <dt className="text-xs text-[#78716C] mb-1">예배 시간</dt>
                    <dd className="font-medium text-[#1C1917] font-tabular">
                      매주 화요일 오전 10:30 / 오후 1:30
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#78716C] mb-1">예배 장소</dt>
                    <dd className="font-medium text-[#1C1917]">수원 빛과소금교회 2층 본당</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={YOUTUBE_LIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>유튜브 PGI 선교회 생중계</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onOpenLiveModal}
                  className="text-xs sm:text-sm font-medium text-[#9A6B22] hover:text-[#785116] underline underline-offset-4 cursor-pointer whitespace-nowrap"
                >
                  온라인 참여 안내 보기
                </button>
              </div>
            </div>
          </article>

          {/* Global Short-Term Missions Card */}
          <article className="lg:col-span-5 bg-[#FBF9F5] border border-stone-200 rounded-xl overflow-hidden flex flex-col">
            <ResilientImage
              src={SITE_IMAGES.jerusalem}
              alt="황금빛 햇살 아래의 예루살렘 성벽과 감람나무"
              aspectClassName="aspect-[16/10] lg:aspect-[4/3]"
              fallbackLabel="PGI 열방 단기선교 · 이스라엘 · 중동 · 중앙아시아"
            />
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
                  <span>연 2회 정기 파송</span>
                  <span aria-hidden="true">·</span>
                  <span>키르기스스탄 선교사 3인 파송</span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-3">
                  열방 단기선교
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed mb-5">
                  주님께 향기로운 분향단의 기도를 올려드리며 주께서 성취하실 언약의 말씀을 현장에서
                  선포하고 예배합니다.
                </p>

                <ul className="divide-y divide-stone-200 border-t border-stone-200">
                  {MISSION_REGIONS.map((region) => (
                    <li key={region.country} className="py-3">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#1C1917]">
                          {region.country}
                        </span>
                        <span className="text-xs font-tabular text-[#9A6B22] shrink-0">
                          {region.period}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E]">{region.focus}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>

        {/* Full-Width North America Chapter Block */}
        <article
          id="north-america"
          className="mt-6 bg-[#FBF9F5] border border-stone-200 rounded-xl p-6 sm:p-8 lg:p-10 scroll-mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
                <Globe className="w-3.5 h-3.5 text-[#9A6B22]" />
                <span>{NORTH_AMERICA_CHAPTER.since}</span>
                <span aria-hidden="true">·</span>
                <span>{NORTH_AMERICA_CHAPTER.communitySize}</span>
              </div>
              <h3 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-3">
                PGI 선교회 미주지부
              </h3>
              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed mb-5">
                {NORTH_AMERICA_CHAPTER.vision}
              </p>

              <div className="pt-4 border-t border-stone-200">
                <p className="text-xs text-[#78716C] mb-2">활동 권역</p>
                <p className="text-sm text-[#1C1917] leading-relaxed">
                  {NORTH_AMERICA_CHAPTER.regions.join(' · ')}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NORTH_AMERICA_CHAPTER.conferences.map((conf) => (
                <div
                  key={conf.region}
                  className="p-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-lg flex flex-col justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-medium text-[#9A6B22] mb-1">북미주 말씀기도 컨퍼런스</p>
                    <h4 className="text-base font-semibold text-[#1C1917] mb-2">{conf.region}</h4>
                    <p className="text-xs text-[#292524] font-tabular mb-2">{conf.date}</p>
                    <p className="text-xs text-[#57534E] leading-relaxed flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" />
                      <span>{conf.venue}</span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-200 text-xs text-[#57534E]">
                    <p>문의: {conf.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Full-Width Domestic Chapters Block (Daegu & Busan) */}
        <article
          id="domestic-chapters"
          className="mt-6 bg-[#FBF9F5] border border-stone-200 rounded-xl p-6 sm:p-8 lg:p-10 scroll-mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-xs text-[#78716C] mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#9A6B22]" />
                <span>수원 본부</span>
                <span aria-hidden="true">·</span>
                <span>대구지부 · 부산지부</span>
              </div>
              <h3 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-3">
                PGI 선교회 국내지부
              </h3>
              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed mb-5">
                {DOMESTIC_CHAPTERS.overview}
              </p>

              <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#78716C] font-tabular">
                  지부 참여 문의 · Tel. {MISSION_META.phone}
                </p>
                <a
                  href="#contact"
                  className="text-xs font-medium text-[#9A6B22] hover:underline underline-offset-4"
                >
                  참여 문의하기 →
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOMESTIC_CHAPTERS.branches.map((branch) => (
                <div
                  key={branch.name}
                  className="p-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-lg flex flex-col justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-medium text-[#9A6B22] mb-1">
                      {branch.region} · {branch.englishName}
                    </p>
                    <h4 className="font-editorial text-xl font-semibold text-[#1C1917] mb-2">
                      {branch.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                      {branch.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-[#57534E]">
                    <span>모임 안내 및 등록</span>
                    <a
                      href="#contact"
                      className="font-medium text-[#1C1917] hover:text-[#9A6B22] transition-colors"
                    >
                      사무국 문의
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
