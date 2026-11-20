import { ArrowUpRight } from 'lucide-react';
import { MISSION_META, YOUTUBE_LIVE_URL } from '../data/pgiData';

interface FooterProps {
  onOpenAdminPage: () => void;
}

export function Footer({ onOpenAdminPage }: FooterProps) {
  return (
    <footer className="bg-[#1C1917] text-stone-300 border-t border-stone-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-stone-800">
          <div className="md:col-span-5 space-y-3">
            <p className="font-editorial text-xl font-semibold text-[#FBF9F5]">
              {MISSION_META.name}
            </p>
            <p className="font-latin-serif text-sm text-[#E7D3AC]">
              {MISSION_META.englishName}
            </p>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              복음 증거와 예배로 분향단의 기도를 채워 나가며, 이스라엘과 열방의 구속사를 수종드는
              사명 공동체입니다.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2 text-sm text-stone-400">
            <p className="text-xs font-medium text-stone-200 mb-3">기관 정보</p>
            <p>비영리법인 피지아이(PGI)선교회 · {MISSION_META.representative}</p>
            <p>{MISSION_META.affiliation}</p>
            <p className="font-tabular">고유번호 {MISSION_META.registrationNumber}</p>
            <p>({MISSION_META.postalCode}) {MISSION_META.address}</p>
            <p className="font-tabular">Tel. {MISSION_META.phone}</p>
          </div>

          <div className="md:col-span-3 space-y-2 text-sm">
            <p className="text-xs font-medium text-stone-200 mb-3">바로가기</p>
            <ul className="space-y-2 text-stone-400">
              <li>
                <a href="#about" className="hover:text-[#FBF9F5] transition-colors">
                  선교회 소개 · 오시는 길
                </a>
              </li>
              <li>
                <a href="#ministry" className="hover:text-[#FBF9F5] transition-colors">
                  화요예배 · 열방선교
                </a>
              </li>
              <li>
                <a href="#training" className="hover:text-[#FBF9F5] transition-colors">
                  훈련 프로그램
                </a>
              </li>
              <li>
                <a href="#torah" className="hover:text-[#FBF9F5] transition-colors">
                  토라포션 안내
                </a>
              </li>
              <li>
                <a href="#community" className="hover:text-[#FBF9F5] transition-colors">
                  커뮤니티 (공지 · 갤러리)
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdminPage}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer text-left"
                >
                  관리자 페이지
                </button>
              </li>
              <li>
                <a
                  href={YOUTUBE_LIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#E7D3AC] hover:underline"
                >
                  <span>유튜브 PGI 선교회</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} PGI 선교회 (Prayer of Golden Incense). All rights reserved.</p>
          <p>시편 122:6 · 예루살렘을 위하여 평안을 구하라</p>
        </div>
      </div>
    </footer>
  );
}
