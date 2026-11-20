import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import QRCode from 'qrcode';
import { TORAH_BOOKS } from '../data/pgiData';

const WEEKLY_TORAH_PORTION_URL = 'https://urimdesign7.github.io/TorahPortion/';

function QrCodeSvg({
  url,
  size = 92,
  label = 'QR 코드',
}: {
  url: string;
  size?: number;
  label?: string;
}) {
  const { modules, moduleCount } = useMemo(() => {
    const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < count; y += 1) {
      for (let x = 0; x < count; x += 1) {
        if (qr.modules.get(x, y)) {
          cells.push({ x, y });
        }
      }
    }
    return { modules: cells, moduleCount: count };
  }, [url]);

  const margin = 2;
  const viewBoxSize = moduleCount + margin * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className="block rounded bg-white p-1 border border-stone-200 shrink-0"
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
      {modules.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x + margin}
          y={cell.y + margin}
          width={1}
          height={1}
          fill="#1C1917"
        />
      ))}
    </svg>
  );
}

export function TorahSection() {
  const [selectedBookId, setSelectedBookId] = useState<string>(TORAH_BOOKS[0].id);
  const selectedBook = TORAH_BOOKS.find((b) => b.id === selectedBookId) ?? TORAH_BOOKS[0];

  return (
    <section id="torah" className="py-16 sm:py-24 border-t border-stone-200 bg-[#F3EFE6]/55">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left 5 Cols: Editorial Introduction */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div>
              <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
                04. 토라포션 (Torah Portion)
              </p>
              <h2 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#1C1917] tracking-tight text-balance mb-4">
                모세오경을 일 년 주기로 묵상하는 말씀의 여정
              </h2>
              <p className="text-[15px] text-[#44403C] leading-relaxed">
                토라 포션(Torah Portion)은 안식일에 읽는 모세오경을 한 주 분량씩 나누어 놓은 성경 읽기
                체계입니다. 히브리어로 ‘이번 주의 사건’을 뜻하는 파라샤(Parashah)라고도 부르며, 매주
                화요예배에서 함께 배우고 나눕니다.
              </p>
            </div>

            {/* Weekly Torah Portion QR Shortcut directly above 총 포션 수 */}
            <a
              href={WEEKLY_TORAH_PORTION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 bg-[#FBF9F5] border border-stone-200 hover:border-[#9A6B22] rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
            >
              <QrCodeSvg
                url={WEEKLY_TORAH_PORTION_URL}
                size={92}
                label="이번 주 토라포션 바로가기 QR 코드"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-editorial text-lg font-semibold text-[#1C1917] group-hover:text-[#9A6B22] transition-colors">
                    이번 주 토라포션 바로가기
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-[#9A6B22] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  QR 코드를 스캔하거나 클릭하시면 이번 주 토라포션 페이지로 바로 연결됩니다.
                </p>
                <p className="text-xs font-medium text-[#9A6B22] truncate">
                  {WEEKLY_TORAH_PORTION_URL}
                </p>
              </div>
            </a>

            <div className="p-6 bg-[#FBF9F5] border border-stone-200 rounded-lg space-y-4">
              <div className="grid grid-cols-3 gap-4 pb-4 border-b border-stone-200">
                <div>
                  <p className="text-xs text-[#78716C] mb-0.5">총 포션 수</p>
                  <p className="font-editorial text-2xl font-semibold text-[#1C1917] font-tabular">
                    54주
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#78716C] mb-0.5">평년 주기</p>
                  <p className="font-editorial text-2xl font-semibold text-[#1C1917] font-tabular">
                    354일
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#78716C] mb-0.5">윤년 주기</p>
                  <p className="font-editorial text-2xl font-semibold text-[#1C1917] font-tabular">
                    384일
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                창세기 12부분, 출애굽기 11부분, 레위기·민수기 각 10부분, 신명기 11부분으로 구성되며,
                특정 안식일에는 두 포션을 함께 읽는 더블 포션(Double Portion)으로 진행됩니다.
              </p>
            </div>
          </div>

          {/* Right 7 Cols: Interactive 5-Book Pentateuch Explorer */}
          <div className="lg:col-span-7 bg-[#FBF9F5] border border-stone-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 pb-5 border-b border-stone-200">
              {TORAH_BOOKS.map((book) => {
                const isActive = book.id === selectedBookId;
                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => setSelectedBookId(book.id)}
                    className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] ${
                      isActive
                        ? 'bg-[#1C1917] text-[#FBF9F5]'
                        : 'bg-[#F3EFE6] text-[#57534E] border border-stone-200 hover:border-stone-400 hover:text-[#1C1917]'
                    }`}
                  >
                    {book.koreanName} ({book.portionCount})
                  </button>
                );
              })}
            </div>

            <div className="pt-6 space-y-6">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h3 className="font-editorial text-2xl font-semibold text-[#1C1917]">
                    {selectedBook.koreanName} · {selectedBook.hebrewName}
                  </h3>
                  <span className="text-xs font-tabular text-[#9A6B22]">
                    {selectedBook.portionCount} Portions
                  </span>
                </div>
                <p className="text-sm text-[#57534E] leading-relaxed">{selectedBook.summary}</p>
              </div>

              <div className="divide-y divide-stone-200 border-t border-stone-200">
                {selectedBook.featuredPortions.map((portion, idx) => (
                  <div
                    key={portion.name}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-tabular text-xs font-medium text-[#9A6B22] pt-0.5 shrink-0 w-5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-sm font-semibold text-[#1C1917]">{portion.name}</span>
                          <span className="text-sm text-[#78716C]" dir="rtl" lang="he">
                            {portion.hebrew}
                          </span>
                        </div>
                        <p className="text-xs text-[#57534E] mt-1">{portion.theme}</p>
                      </div>
                    </div>
                    <span className="font-tabular text-xs font-medium text-[#9A6B22] shrink-0 pl-8 sm:pl-0">
                      {portion.reference}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
