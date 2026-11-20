import { useState } from 'react';
import { ArrowRight, Calendar, MapPin, Phone } from 'lucide-react';
import { TRAINING_PROGRAMS, type TrainingProgram } from '../data/pgiData';
import { ResilientImage } from './ResilientImage';

interface TrainingSectionProps {
  onSelectProgramForInquiry: (programTitle: string) => void;
}

export function TrainingSection({ onSelectProgramForInquiry }: TrainingSectionProps) {
  const [selectedId, setSelectedId] = useState<TrainingProgram['id']>('conference');
  const current = TRAINING_PROGRAMS.find((p) => p.id === selectedId) ?? TRAINING_PROGRAMS[0];

  return (
    <section id="training" className="py-16 sm:py-24 border-t border-stone-200 bg-[#FBF9F5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Header + Program Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <p className="text-xs font-medium text-[#9A6B22] tracking-wide mb-2">
              03. 훈련 프로그램
            </p>
            <h2 className="font-editorial text-2xl sm:text-4xl font-semibold text-[#1C1917] tracking-tight text-balance">
              말씀과 기도로 세워지는 제자 양육 과정
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="훈련 프로그램 선택"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg self-start lg:self-auto"
          >
            {TRAINING_PROGRAMS.map((prog) => {
              const isActive = prog.id === selectedId;
              return (
                <button
                  key={prog.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedId(prog.id)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] ${
                    isActive
                      ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {prog.number}. {prog.title.replace('PGI ', '').replace(' (제자스쿨)', '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Balanced Detail Split */}
        <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Visual & Scripture Anchor */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#F3EFE6]/75 border border-stone-200 rounded-xl overflow-hidden">
            <ResilientImage
              src={current.image}
              alt={current.imageAlt}
              aspectClassName="aspect-[4/3]"
              fallbackLabel={current.title}
            />

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-[#78716C] mb-2">주제 말씀 · {current.verseRef}</p>
                <p className="font-editorial text-lg sm:text-xl text-[#1C1917] leading-relaxed">
                  “{current.verse}”
                </p>
              </div>

              <p className="text-xs text-[#57534E] mt-6 pt-4 border-t border-stone-200">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Right Column: Structured Program Information */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9A6B22] font-tabular mb-2">
                <span>PROGRAM {current.number}</span>
                <span aria-hidden="true">/</span>
                <span>{current.scheduleLabel}</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917] mb-3">
                {current.title}
              </h3>
              <p className="text-[15px] sm:text-base text-[#44403C] leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Schedule List */}
            <div className="py-5 border-y border-stone-200 space-y-3">
              <p className="text-xs font-medium text-[#78716C] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#9A6B22]" />
                <span>훈련 일정 및 구성</span>
              </p>
              <ul className="space-y-2">
                {current.schedule.map((line, i) => (
                  <li key={i} className="text-sm text-[#1C1917] flex items-start gap-2.5">
                    <span className="font-tabular text-xs text-[#9A6B22] mt-0.5">
                      0{i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Logistics Definition Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-[#78716C] mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9A6B22]" />
                  <span>장소</span>
                </dt>
                <dd className="font-medium text-[#1C1917] leading-snug">{current.location}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#78716C] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#9A6B22]" />
                  <span>사역 문의</span>
                </dt>
                <dd className="text-xs sm:text-sm text-[#292524]">{current.contact}</dd>
              </div>
            </dl>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#78716C] space-y-1">
                {current.notes.map((n, i) => (
                  <p key={i}>· {n}</p>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSelectProgramForInquiry(current.title)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22]"
              >
                <span>이 과정 신청 · 문의하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
