export interface VisionPillar {
  index: string;
  title: string;
  summary: string;
}

export interface MissionAction {
  index: string;
  title: string;
  detail: string;
}

export interface HistoryYear {
  year: string;
  events: {
    date: string;
    title: string;
    location?: string;
  }[];
}

export interface TrainingProgram {
  id: 'conference' | 'disciple' | 'youth';
  number: string;
  title: string;
  subtitle: string;
  verse: string;
  verseRef: string;
  description: string;
  image: string;
  imageAlt: string;
  scheduleLabel: string;
  schedule: string[];
  location: string;
  contact: string;
  notes: string[];
}

export type CommunityCategory = '공지' | '갤러리';

export type NoticeCategory =
  | CommunityCategory
  | '기도말씀 컨퍼런스'
  | '화요예배'
  | '제자스쿨'
  | '청청캠프'
  | '공지사항';

export function normalizeCommunityCategory(category: string): CommunityCategory {
  return category === '갤러리' ? '갤러리' : '공지';
}

export interface NoticeItem {
  id: number | string;
  category: NoticeCategory;
  title: string;
  dateLabel: string;
  summary: string;
  body: string[];
  imageUrl?: string;
  imageUrls?: string[];
  isPinned?: boolean;
  authorName?: string;
}

export function getNoticeImages(item: Pick<NoticeItem, 'imageUrl' | 'imageUrls'>): string[] {
  const fromArray = Array.isArray(item.imageUrls)
    ? item.imageUrls.map((u) => u.trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray)).slice(0, 10);
  }
  const single = item.imageUrl?.trim();
  return single ? [single] : [];
}

export interface TorahBook {
  id: string;
  koreanName: string;
  hebrewName: string;
  portionCount: number;
  summary: string;
  featuredPortions: {
    name: string;
    hebrew: string;
    reference: string;
    theme: string;
  }[];
}

export interface MissionRegion {
  country: string;
  period: string;
  focus: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  kicker: string;
  caption: string;
}

export const SITE_IMAGES = {
  hero: '/src/assets/images/real_golden_incense_altar_1795004157823.jpg',
  heroJerusalem: '/src/assets/images/real_jerusalem_oldcity_hero_1795003475135.jpg',
  heroSanctuary: '/src/assets/images/real_bible_prayer_hero_1795003475196.jpg',
  worship: '/src/assets/images/worship_tuesday_1795001087552.jpg',
  conference: '/src/assets/images/training_conference_1795001087910.jpg',
  jerusalem: '/src/assets/images/mission_jerusalem_1795001087421.jpg',
  youth: '/src/assets/images/youth_camp_1795001087765.jpg',
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'incense-altar',
    image: SITE_IMAGES.hero,
    alt: '성전 석조 공간 가운데 향기로운 연기가 피어오르는 황금 분향단 실사 사진',
    kicker: 'Prayer of Golden Incense · 시편 122:6',
    caption: '분향단의 기도와 예배로 주님의 오심을 준비하는 공동체',
  },
  {
    id: 'jerusalem',
    image: SITE_IMAGES.heroJerusalem,
    alt: '맑은 아침 햇살 아래의 예루살렘 성벽과 감람산 실사 전경',
    kicker: 'Israel & The Nations · 아가서 7:10',
    caption: '예루살렘의 평안을 구하며 열방의 구속사를 수종드는 사역',
  },
  {
    id: 'bible',
    image: SITE_IMAGES.heroSanctuary,
    alt: '예배당 강대상 위에 펼쳐진 성경 말씀 실사 사진',
    kicker: 'Torah Portion & Discipleship · 마태복음 4:17',
    caption: '매주 화요예배와 말씀 훈련으로 주의 신부를 단장하는 공동체',
  },
];

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@PGI-pgi';
export const YOUTUBE_LIVE_URL = 'https://www.youtube.com/@PGI-uk2gg/streams';

export const MISSION_META = {
  name: 'PGI 선교회',
  englishName: 'Prayer of Golden Incense',
  representative: '이지애 대표',
  affiliation: 'KAICAM(한국독립교회선교단체연합회) 소속',
  registrationNumber: '144-82-73944',
  address: '경기도 수원시 권선구 동수원로 25번길 55 (빛과소금교회 2층 본당)',
  postalCode: '16666',
  phone: '031-224-2885',
};

export const VISION_PILLARS: VisionPillar[] = [
  {
    index: '01',
    title: '다음세대와 한국교회의 연합',
    summary:
      '세대와 교파의 경계를 넘어 한국교회와 다음세대가 말씀과 기도로 하나 되어 주님의 몸을 세워갑니다.',
  },
  {
    index: '02',
    title: '선교지의 필요를 적극 섬김',
    summary:
      '열방 가운데 세워진 선교 현장과 파송 선교사들의 실제적인 필요를 기도와 물질, 현장 동역으로 섬깁니다.',
  },
  {
    index: '03',
    title: '시대의 요청과 빌라델비아 교회 모델',
    summary:
      '시대의 영적 요청에 즉각 반응하며 유대인과 이방인이 하나 되는 빌라델비아(형제사랑) 교회의 모델을 지향합니다.',
  },
  {
    index: '04',
    title: '새 하늘과 새 땅의 기초를 세우는 대언',
    summary:
      '기록된 하나님의 말씀에 근거한 대언적 선포와 예배를 통해 새 하늘과 새 땅의 영적 기초를 견고히 세웁니다.',
  },
];

export const MISSION_ACTIONS: MissionAction[] = [
  {
    index: '01',
    title: '선교사 파송 및 지원 사역',
    detail: '키르기스스탄 파송 선교사 3인을 비롯한 열방 사역자 파송 및 지속적 후원',
  },
  {
    index: '02',
    title: '연 2회 기도말씀 컨퍼런스',
    detail: '상·하반기 정기 컨퍼런스를 통해 시대와 말씀을 분별하고 분향단의 기도를 드리는 훈련',
  },
  {
    index: '03',
    title: '연 1회 디싸이플 스쿨 및 청청캠프',
    detail: '제자스쿨과 청년·청소년 캠프를 통해 주의 신부로 준비되는 말씀 영성 양육',
  },
  {
    index: '04',
    title: '매주 화요일 정기 토라포션 예배',
    detail: '매주 화요일 오전·오후 예배를 통해 모세오경 토라포션을 배우고 나누며 함께 기도',
  },
  {
    index: '05',
    title: '연 2회 열방 단기선교 및 중보',
    detail: '이스라엘, 이집트, 튀르키예, 중앙아시아 현장을 방문해 예배와 기도, 복음 증거를 수행',
  },
];

export const GREETING_PARAGRAPHS = [
  {
    heading: '시대를 분별하며 주님의 대로를 수축합니다',
    paragraphs: [
      '오늘날 중동과 열방 가운데 일어나는 급변하는 정세는 세계 질서를 재편하며 성경의 언약적 말씀들을 조명하고 있습니다. PGI 공동체는 시대를 분별하며 주님의 구속사에 발맞추어 나아가며, 주께서 오실 대로를 수축하는 부르심 앞에 서 있습니다.',
      '하루하루 숨가쁘게 벌어지는 세상의 혼돈 속에서도 진정한 해답은 오직 성경 말씀 안에서만 찾을 수 있습니다.',
    ],
    scripture: {
      ref: '아모스 3:7-8',
      text: '주 여호와께서는 자기의 비밀을 그 종 선지자들에게 보이지 아니하시고는 결코 행하심이 없으시리라. 사자가 부르짖은즉 누가 두려워하지 아니하겠느냐 주 여호와께서 말씀하신즉 누가 예언하지 아니하겠느냐',
    },
  },
  {
    heading: '풀무 불에서 택함받은 감사와 찬양의 공동체',
    paragraphs: [
      '주님은 예언적 기도와 예배의 사역을 감당할 신부들을 준비하시고자 PGI 선교회를 세우셨습니다. 고난의 연단을 통과하며 감사의 고백으로 서 온 공동체는 이제 3년의 준비 기간을 지나 열방을 향해 날개를 펴고 있습니다.',
      '에스겔이 마른 뼈 골짜기에서 하나님의 말씀을 대언하여 생기가 들어가게 했던 것처럼, 우리 또한 말씀과 기도로 시대의 영적 깨어남을 감당합니다.',
    ],
    scripture: {
      ref: '이사야 48:10',
      text: '보라 내가 너를 연단하였으나 은처럼 하지 아니하고 너를 고난의 풀무 불에서 택하였노라',
    },
  },
  {
    heading: '이스라엘을 향한 갈망, 열방을 향한 영향력',
    paragraphs: [
      '일곱 등잔대인 교회의 불빛은 이스라엘을 향한 하나님의 마음을 품고, 동시에 아무라도 셀 수 없는 열방의 백성을 향해 비춥니다. 사역의 우선순위는 이스라엘의 회복에 있고, 사역의 영향력은 열방의 모든 민족으로 흘러갑니다.',
      'PGI 선교회는 서로를 존귀히 여기고 격려하는 성도의 진영이 되어 끝까지 사랑하시는 예루살렘의 평안을 구하며 주님의 오심을 준비하겠습니다.',
    ],
    scripture: {
      ref: '시편 122:6',
      text: '예루살렘을 위하여 평안을 구하라 예루살렘을 사랑하는 자는 형통하리로다',
    },
  },
];

export const HISTORY_TIMELINE: HistoryYear[] = [
  {
    year: '2025',
    events: [
      { date: '07.24 – 07.26', title: '청년 & 청소년 여름 복음캠프', location: '수원 빛과소금교회' },
      { date: '07.03 – 07.05', title: '디싸이플 스쿨(Disciple School) 2기', location: '천안 겟세마네기도원' },
      { date: '05.25 – 06.06', title: '이스라엘 단기선교 파송 및 현장 예배', location: '이스라엘' },
      { date: '03.15 – 04.26', title: '제6기 기도 말씀 컨퍼런스', location: '수원 PGI센터' },
      { date: '01.19', title: 'KAICAM(한국독립교회선교단체연합회) 정식 가입', location: '서울' },
      { date: '01.09 – 01.24', title: '이집트 단기선교', location: '이집트' },
      { date: '01.07', title: 'PGI선교회 수원 센터 개원 계약', location: '수원 권선구 동수원로 25번길 55' },
    ],
  },
  {
    year: '2024',
    events: [
      { date: '11.18', title: '매주 화요 정기예배 시작', location: '수원 빛과소금교회' },
      { date: '10.12 – 11.23', title: '제5기 기도 말씀 컨퍼런스', location: '겟세마네기도원' },
      { date: '08.12 – 09.07', title: '제1기 디싸이플 스쿨(Disciple School)', location: '빛과소금교회' },
      { date: '05.13 – 05.24', title: '이스라엘 단기선교', location: '이스라엘' },
      { date: '04 – 05월', title: '제4기 기도 말씀 컨퍼런스', location: '겟세마네기도원' },
      { date: '03.27', title: '피지아이(PGI)선교회 비영리법인 고유번호증 발급 (144-82-73944)' },
      { date: '03.01', title: '비영리법인 설립총회 및 정관 제정 · 이지애 대표 재선임' },
      { date: '01.19 – 02.01', title: '튀르키예 단기선교', location: '튀르키예' },
    ],
  },
  {
    year: '2023',
    events: [
      { date: '09 – 11월', title: '제3기 기도 말씀 컨퍼런스', location: '겟세마네기도원' },
      { date: '08.18 – 08.19', title: '케투빔 스쿨 — 아가서 강해' },
      { date: '07.08 – 07.19', title: '키르기스스탄 단기선교', location: '키르기스스탄' },
      { date: '04 – 06월', title: '제2기 기도 말씀 컨퍼런스', location: '갈멜산기도원' },
      { date: '02.24 – 03.07', title: '이스라엘 단기선교', location: '이스라엘' },
    ],
  },
  {
    year: '2022',
    events: [
      { date: '2022.11 – 2023.01', title: '제1기 기도 말씀 컨퍼런스', location: '갈멜산기도원' },
      { date: '10.06', title: '비영리 임의단체 고유번호증 발급 (856-80-02534)' },
      { date: '10.04', title: '피지아이(PGI)선교회 규약 제정 및 이지애 대표 선임' },
      { date: '09.15', title: '피지아이(PGI)선교회 설립 모임 및 발대식' },
    ],
  },
];

export const MISSION_REGIONS: MissionRegion[] = [
  { country: '이스라엘 (Israel)', period: '2023 · 2024 · 2025.05', focus: '예루살렘 평안을 위한 현장 예배 및 성지 중보' },
  { country: '이집트 (Egypt)', period: '2025.01', focus: '이사야 19장 중동 도로 회복과 축복의 중보 사역' },
  { country: '튀르키예 (Türkiye)', period: '2024.01', focus: '요한계시록 소아시아 일곱 교회 순례 및 기도' },
  { country: '키르기스스탄 (Kyrgyzstan)', period: '2023.07 · 선교사 3인 파송', focus: '중앙아시아 복음 전파 및 파송 선교사 동역' },
];

export const NORTH_AMERICA_CHAPTER = {
  since: '2023년 설립',
  regions: ['워싱턴주 (시애틀 · 타코마)', '캘리포니아 (로스앤젤레스 · 풀러턴)', '샌프란시스코', '캐나다 밴쿠버'],
  communitySize: '북미주 약 100여 명의 성도 및 스텝 동역',
  vision: '북미 전역과 영어권 2세 다음세대, 열방의 청년들을 말씀과 분향단의 기도로 깨우는 사역',
  conferences: [
    {
      region: '시애틀 지역 (3기)',
      date: '2025년 8월 14일(목) 13:00 – 8월 16일(토) 17:00',
      venue: 'Newport Hills Community Church (5833 119th Ave SE, Bellevue, WA 98006)',
      contact: '한은영 간사 (Kakao: @uyh24)',
    },
    {
      region: 'LA 지역 (3기)',
      date: '2025년 8월 19일(화) 09:30 – 8월 20일(수) 17:00',
      venue: 'Grace River Korean United Methodist Church (2351 W Orangethorpe Ave, Fullerton, CA 92833)',
      contact: '김헬렌 간사 (Kakao: @wa98198 / 661-524-4575)',
    },
  ],
};

export const DOMESTIC_CHAPTERS = {
  overview:
    '수원 선교회 본부를 중심으로 영남권에서도 주님의 신부로 단장되며 토라포션 말씀과 분향단의 기도로 연합하는 국내 지역 공동체입니다.',
  branches: [
    {
      name: '대구지부',
      englishName: 'Daegu Chapter',
      region: '대구 · 경북 권역',
      description:
        '대구 지역 성도들이 함께 모여 매주 토라포션 말씀을 나누고 이스라엘과 한국교회의 회복을 위해 중보기도하는 지역 지부입니다.',
    },
    {
      name: '부산지부',
      englishName: 'Busan Chapter',
      region: '부산 · 경남 권역',
      description:
        '부산 지역에서 예배와 말씀 훈련으로 동역하며 다음세대와 열방 선교의 비전을 함께 세워 나가는 지역 지부입니다.',
    },
  ],
};

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'conference',
    number: '01',
    title: 'PGI 기도 말씀 컨퍼런스',
    subtitle: '연 2회(상·하반기) 정기 말씀과 분향단의 기도 훈련',
    verse: '내 사랑하는 자에게 속하였도다 그가 나를 사모하는구나',
    verseRef: '아가서 7:10',
    description:
      '하나님의 구속사에 수종들며 주의 말씀이 성취되도록 예배하고 기도하는 분향의 사역자를 세우는 핵심 훈련입니다. 선지서(이사야, 미가, 에스겔, 다니엘, 스가랴, 요한계시록)를 체계적으로 강해하며 시대를 읽는 영적 눈을 엽니다.',
    image: SITE_IMAGES.conference,
    imageAlt: '성경과 노트가 펼쳐진 PGI 기도 말씀 컨퍼런스 연구 테이블',
    scheduleLabel: '정기 일정 (6기 기준 · 9기 진행 중)',
    schedule: [
      '연 2회 진행 — 상반기(3~4월경 시작) / 하반기(9~10월경 시작)',
      '1차: 이사야 · 미가 강해 / 2차: 집중 기도 세미나',
      '3차: 에스겔 · 다니엘 강해 / 4차: 스가랴 · 요한계시록 강해',
    ],
    location: '수원 빛과소금교회 PGI센터 (수원시 권선구 동수원로 25번길 55)',
    contact: 'PGI 선교회 사무국 · Tel. 031-224-2885',
    notes: [
      '기도세미나 중 개인 기도는 별도로 진행하지 않습니다.',
      '최신 9기 기도말씀 컨퍼런스 세부 일정은 공지사항에서 확인하실 수 있습니다.',
    ],
  },
  {
    id: 'disciple',
    number: '02',
    title: 'Disciple School (제자스쿨)',
    subtitle: '천국을 증거하는 제자도 영성 집중 합숙 훈련',
    verse: '이 때부터 예수께서 비로소 전파하여 이르시되 회개하라 천국이 가까이 왔느니라 하시더라',
    verseRef: '마태복음 4:17',
    description:
      '하나님의 구속사에 동참하여 말씀이 성취되도록 예배하고 기도하는 주의 제자이자 신부로 단장되도록 돕는 집중 스쿨입니다. 소수 정예 합숙과 심층 말씀 양육, 인터뷰를 통해 헌신된 사역자를 세웁니다.',
    image: SITE_IMAGES.worship,
    imageAlt: '햇빛이 들어오는 고요한 예배당 강대상 위의 성경',
    scheduleLabel: '과정 안내 (2기 기준 · 3기 개강)',
    schedule: [
      '2박 3일 집중 합숙 훈련 (목요일 오전 10:00 – 토요일 오후 1:00)',
      '장소 여건상 선착순 접수 및 사전 인터뷰를 통해 인원을 선발합니다.',
    ],
    location: '천안 겟세마네기도원 (기수별 장소 공지)',
    contact: '팀장 이은주 · 행정팀장 김형채',
    notes: [
      '온라인 신청서 작성 및 사전 인터뷰 확인 후 등록이 최종 완료됩니다.',
      '2026년 3기 제자스쿨 세부 공지는 공지사항 게시판을 확인해 주세요.',
    ],
  },
  {
    id: 'youth',
    number: '03',
    title: '청년 · 청소년 청청캠프',
    subtitle: '진리를 분별하고 말씀 위에 세워지는 믿음의 다음세대',
    verse: '청년들아 내가 너희에게 쓴 것은 너희가 강하고 하나님의 말씀이 너희 안에 거하시며 너희가 흉악한 자를 이기었음이라',
    verseRef: '요한일서 2:14',
    description:
      '진리와 비진리가 혼재된 시대 속에서 한국교회 청년과 청소년이 하나님의 말씀으로 분별력을 얻고, 기름 부으심 안에서 거짓을 이기는 믿음의 군대로 일어나도록 돕는 겨울·여름 복음 캠프입니다.',
    image: SITE_IMAGES.youth,
    imageAlt: '자연광 아래 함께 찬양하며 말씀을 나누는 청년 공동체',
    scheduleLabel: '캠프 일정 (겨울 · 여름 연 2회)',
    schedule: [
      '겨울 캠프: 2월 첫째 주 수요일 – 토요일 (3박 4일)',
      '여름 캠프: 7월 하순 진행 (매년 일정 공지)',
      '참여 대상: 한국교회 모든 청년 및 청소년',
    ],
    location: '수원 빛과소금교회 (경기도 수원시 권선구 동수원로 25번길 55)',
    contact: '청청캠프 사역팀 · Tel. 031-224-2885',
    notes: [
      '요한일서 2장 27절 말씀에 기초한 말씀 강해, 워십, 소그룹 나눔이 함께 진행됩니다.',
      '단체 및 교회 단위 참가 문의는 선교회 대표 번호로 연락해 주세요.',
    ],
  },
];

export const TORAH_BOOKS: TorahBook[] = [
  {
    id: 'genesis',
    koreanName: '창세기',
    hebrewName: '베레쉬트 (בְּרֵאשִׁית)',
    portionCount: 12,
    summary: '태초의 창조와 타락, 노아의 언약, 그리고 아브라함·이삭·야곱·요셉으로 이어지는 믿음의 족장 언약',
    featuredPortions: [
      { name: '베레쉬트 (태초에)', hebrew: 'בְּרֵאשִׁית', reference: '창 1:1–6:8', theme: '빛과 창조의 질서, 아담의 언약' },
      { name: '노아흐 (노아)', hebrew: 'נֹחַ', reference: '창 6:9–11:32', theme: '방주와 홍수 심판, 무지개 언약과 바벨탑' },
      { name: '레흐 레하 (너는 떠나라)', hebrew: 'לֶךְ־לְךָ', reference: '창 12:1–17:27', theme: '아브라함의 부르심, 가나안 약속과 할례 언약' },
      { name: '바예라 (그가 나타나시니)', hebrew: 'וַיֵּרָא', reference: '창 18:1–22:24', theme: '마므레 방문, 이삭의 탄생과 모리아 산의 번제' },
      { name: '하예이 사라 (사라의 생애)', hebrew: 'חַיֵּי שָׂרָה', reference: '창 23:1–25:18', theme: '막벨라 굴 매입과 이삭의 신부 리브가 맞음' },
      { name: '톨도트 (계보)', hebrew: 'תּוֹלְדֹת', reference: '창 25:19–28:9', theme: '야곱과 에서, 장자의 명분과 이삭의 축복' },
      { name: '바예체 (그가 나가서)', hebrew: 'וַיֵּצֵא', reference: '창 28:10–32:3', theme: '벧엘의 사닥다리와 열두 지파의 태동' },
      { name: '바위슐라흐 (그가 보내어)', hebrew: 'וַיִּשְׁלַח', reference: '창 32:4–36:43', theme: '얍복강 씨름과 이스라엘이라는 새 이름' },
      { name: '바예쉐브 (그가 거주하니)', hebrew: 'וַיֵּשֶׁב', reference: '창 37:1–40:23', theme: '요셉의 꿈, 애굽 이주와 옥중의 해몽' },
      { name: '미케츠 (끝에)', hebrew: 'מִקֵּץ', reference: '창 41:1–44:17', theme: '바로의 꿈 해몽, 애굽 총리와 형제들의 재회' },
      { name: '바이가쉬 (그가 가까이 가매)', hebrew: 'וַיִּגַּשׁ', reference: '창 44:18–47:27', theme: '유다의 중보, 요셉의 화해와 고센 정착' },
      { name: '바예히 (그가 살았더라)', hebrew: 'וַיְחִי', reference: '창 47:28–50:26', theme: '열두 지파를 향한 야곱의 유언적 축복' },
    ],
  },
  {
    id: 'exodus',
    koreanName: '출애굽기',
    hebrewName: '쉐모트 (שְׁמוֹת)',
    portionCount: 11,
    summary: '구속과 해방, 시내산 언약과 제사장 나라의 소명(출 19:5-6), 그리고 하나님이 거하시는 성막의 설계',
    featuredPortions: [
      { name: '쉐모트 (이름들)', hebrew: 'שְׁמוֹת', reference: '출 1:1–6:1', theme: '애굽의 압제, 모세의 출생과 호렙산 떨기나무 부르심' },
      { name: '바에라 (내가 나타났노라)', hebrew: 'וָאֵרָא', reference: '출 6:2–9:35', theme: '언약의 재확증과 애굽을 향한 일곱 재앙' },
      { name: '보 (들어가라)', hebrew: 'בֹּא', reference: '출 10:1–13:16', theme: '마지막 세 재앙, 유월절 어린양과 출애굽의 구속' },
      { name: '베샬라흐 (보내실 때에)', hebrew: 'בְּשַׁלַּח', reference: '출 13:17–17:16', theme: '홍해 도하와 모세의 노래, 만나와 아말렉 전쟁' },
      { name: '이트로 (이드로)', hebrew: 'יִתְרוֹ', reference: '출 18:1–20:23', theme: '제사장 나라의 선포(출 19:5-6)와 시내산 십계명' },
      { name: '미슈파팀 (규례들)', hebrew: 'מִשְׁפָּטִים', reference: '출 21:1–24:18', theme: '언약의 율례와 시내산 피의 언약 체결' },
      { name: '테루마 (예물)', hebrew: 'תְּרוּמָה', reference: '출 25:1–27:19', theme: '언약궤, 진설병 상, 일곱 등잔대와 성막 설계' },
      { name: '테차베 (명령하라)', hebrew: 'תְּצַוֶּה', reference: '출 27:20–30:10', theme: '등불의 감람유, 제사장의 예복과 분향단 규례' },
      { name: '키 티사 (계수할 때에)', hebrew: 'כִּי תִשָּׂא', reference: '출 30:11–34:35', theme: '속전과 물두멍, 금송아지 사건과 하나님의 성품 선포' },
      { name: '바야크헬 (모으고)', hebrew: 'וַיַּקְהֵל', reference: '출 35:1–38:20', theme: '안식일 규례와 자원하는 예물로 세워지는 성막 제작' },
      { name: '페쿠데이 (계수함이라)', hebrew: 'פְקוּדֵי', reference: '출 38:21–40:38', theme: '성막 봉헌과 여호와의 영광이 회막에 충만함' },
    ],
  },
  {
    id: 'leviticus',
    koreanName: '레위기',
    hebrewName: '바이크라 (וַיִּקְרָא)',
    portionCount: 10,
    summary: '거룩한 하나님 앞에 나아가는 제사의 규례와 정결, 그리고 여호와의 절기에 담긴 구속사적 시간표',
    featuredPortions: [
      { name: '바이크라 (부르시고)', hebrew: 'וַיִּקְרָא', reference: '레 1:1–5:26', theme: '다섯 가지 제사(번제·소제·화목제·속죄제·속건제)의 규례' },
      { name: '차브 (명령하라)', hebrew: 'צַו', reference: '레 6:1–8:36', theme: '꺼지지 않는 제단의 불과 아론과 아들들의 위임식' },
      { name: '쉐미니 (여덟째 날에)', hebrew: 'שְׁמִינִי', reference: '레 9:1–11:47', theme: '첫 제사와 여호와의 불, 정결한 음식과 거룩의 분별' },
      { name: '타즈리아 (잉태하여)', hebrew: 'תַזְרִיעַ', reference: '레 12:1–13:59', theme: '정결 규례와 나병 진단에 관한 영적 분별' },
      { name: '메초라 (나병 환자)', hebrew: 'מְצֹרָע', reference: '레 14:1–15:33', theme: '두 마리 새의 정결 예식과 성결의 회복' },
      { name: '아하레이 모트 (죽은 후에)', hebrew: 'אַחֲרֵי מוֹת', reference: '레 16:1–18:30', theme: '대속죄일(욤 키푸르) 지성소의 분향과 아사셀 염소' },
      { name: '케도쉼 (거룩하라)', hebrew: 'קְדֹשִׁים', reference: '레 19:1–20:27', theme: '거룩의 부르심과 이웃 사랑(레 19:18)의 계명' },
      { name: '에모르 (말하라)', hebrew: 'אֱמֹר', reference: '레 21:1–24:23', theme: '제사장의 성결, 여호와의 일곱 절기와 성전 등불' },
      { name: '베하르 (시내산에서)', hebrew: 'בְּהַר', reference: '레 25:1–26:2', theme: '안식년과 희년(요벨), 땅과 백성의 회복과 속량' },
      { name: '베후코타이 (내 규례를 따르면)', hebrew: 'בְּחֻקֹּתַי', reference: '레 26:3–27:34', theme: '순종의 축복과 회복의 언약, 성물의 서원 규례' },
    ],
  },
  {
    id: 'numbers',
    koreanName: '민수기',
    hebrewName: '베미드바르 (בְּמִדְבַּר)',
    portionCount: 10,
    summary: '광야에서의 행진과 성막을 중심으로 한 진영의 질서, 불신앙의 시험을 지나 약속의 땅을 바라보는 여정',
    featuredPortions: [
      { name: '베미드바르 (광야에서)', hebrew: 'בְּמִדְבַּר', reference: '민 1:1–4:20', theme: '인구조사와 성막 중심의 열두 지파 진영 배치' },
      { name: '나소 (계수하라)', hebrew: 'נָשֹׂא', reference: '민 4:21–7:89', theme: '나실인의 서원과 제사장의 축복 기도(민 6:24-26)' },
      { name: '베하알로트카 (등불을 켤 때에)', hebrew: 'בְּהַעֲלֹתְךָ', reference: '민 8:1–12:16', theme: '일곱 등잔대의 점화, 은나팔과 광야의 구름기둥' },
      { name: '쉘라흐 (보내라)', hebrew: 'שְׁלַח־לְךָ', reference: '민 13:1–15:41', theme: '가나안 정탐꾼, 여호수아와 갈렙의 믿음 및 옷단 술' },
      { name: '코라흐 (고라)', hebrew: 'קֹרַח', reference: '민 16:1–18:32', theme: '고라의 반역과 아론의 싹 난 지팡이, 제사장 직분' },
      { name: '후카트 (율례)', hebrew: 'חֻקַּת', reference: '민 19:1–22:1', theme: '붉은 암송아지의 정결 예식과 광야의 놋뱀 사건' },
      { name: '발락 (발락)', hebrew: 'בָּלָק', reference: '민 22:2–25:9', theme: '발람의 예언과 야곱에게서 나오는 한 별의 메시아 언약' },
      { name: '피느하스 (비느하스)', hebrew: 'פִּינְחָס', reference: '민 25:10–30:1', theme: '비느하스의 질투와 평화의 언약, 절기별 번제 규례' },
      { name: '마토트 (지파들)', hebrew: 'מַטּוֹת', reference: '민 30:2–32:42', theme: '서원의 신실함과 요단 동편 두 지파 반의 분배' },
      { name: '마세이 (행진 경로들)', hebrew: 'מַסְעֵי', reference: '민 33:1–36:13', theme: '애굽에서 요단까지 42개 진영의 여정과 도피성 규례' },
    ],
  },
  {
    id: 'deuteronomy',
    koreanName: '신명기',
    hebrewName: '데바림 (דְּבָרִים)',
    portionCount: 11,
    summary: '가나안 입성을 앞둔 모세의 마지막 설교 — 마음과 뜻을 다한 사랑(쉐마)과 언약의 갱신',
    featuredPortions: [
      { name: '데바림 (말씀들)', hebrew: 'דְּבָרִים', reference: '신 1:1–3:22', theme: '모압 평지에서 회고하는 광야 40년의 은혜' },
      { name: '바에트하난 (내가 간구하였노라)', hebrew: 'וָאֶתְחַנַּן', reference: '신 3:23–7:11', theme: '쉐마 이스라엘(신 6:4-9)과 유일하신 주' },
      { name: '에케브 (이로 말미암아)', hebrew: 'עֵקֶב', reference: '신 7:12–11:25', theme: '사람이 떡으로만 사는 것이 아니요 말씀의 훈련' },
      { name: '레에 (보라)', hebrew: 'רְאֵה', reference: '신 11:26–16:17', theme: '축복과 저주의 선택, 택하신 곳에서의 예배와 세 절기' },
      { name: '쇼프팀 (재판장들)', hebrew: 'שֹׁפְטִים', reference: '신 16:18–21:9', theme: '공의의 통치와 모세와 같은 한 선지자의 예언' },
      { name: '키 테체 (네가 나갈 때에)', hebrew: 'כִּי־תֵצֵא', reference: '신 21:10–25:19', theme: '공동체 윤리와 약자 보호, 거룩한 삶의 계명' },
      { name: '키 타보 (네가 들어갈 때에)', hebrew: 'כִּי־תָבוֹא', reference: '신 26:1–29:8', theme: '첫 열매의 감사 고백과 에발산·그리심산의 언약' },
      { name: '니차빔 (너희가 서 있느니라)', hebrew: 'נִצָּבִים', reference: '신 29:9–30:20', theme: '마음의 할례와 생명과 복을 택하라는 언약의 초청' },
      { name: '바옐레흐 (모세가 가서)', hebrew: 'וַיֵּלֶךְ', reference: '신 31:1–30', theme: '여호수아 위임과 초막절 토라 낭독의 사명' },
      { name: '하아지누 (귀를 기울이라)', hebrew: 'הַאֲזִינוּ', reference: '신 32:1–52', theme: '하늘과 땅을 증인 삼아 부른 모세의 언약의 노래' },
      { name: '베조트 하베라카 (이것이 축복이라)', hebrew: 'וְזֹאת הַבְּרָכָה', reference: '신 33:1–34:12', theme: '열두 지파를 향한 모세의 마지막 축복과 시내산의 불길' },
    ],
  },
];

export const NOTICES: NoticeItem[] = [
  {
    id: 14,
    category: '공지',
    title: 'PGI 9기 기도말씀컨퍼런스 신청안내',
    dateLabel: '최근 공지 · 기도말씀 컨퍼런스',
    summary: '하나님의 구속사와 선지서 말씀을 통해 시대를 분별하고 분향단의 기도를 배우는 PGI 9기 컨퍼런스 신청을 안내합니다.',
    body: [
      'PGI 9기 기도말씀컨퍼런스가 수원 빛과소금교회 PGI센터에서 진행됩니다.',
      '성경 선지서 강해와 집중 기도 세미나를 통해 주님의 신부로 단장되고, 이스라엘과 열방을 향한 하나님의 마음을 함께 품는 시간입니다.',
      '세부 회차별 일정 및 신청 문의는 사무국(031-224-2885)으로 연락해 주시기 바랍니다.',
    ],
  },
  {
    id: 13,
    category: '공지',
    title: '6–7월 화요예배 휴일 공지',
    dateLabel: '예배 안내 · 화요예배',
    summary: '단기선교 및 정기 훈련 사역 일정에 따른 화요예배 휴강 일정을 사전에 안내해 드립니다.',
    body: [
      '매주 화요일 오전 10시 30분과 오후 1시 30분에 드려지는 PGI 화요예배의 휴일 일정을 공지합니다.',
      '성도님들의 일정에 착오 없으시길 바라며, 예배가 있는 주간에는 현장 예배와 유튜브 "PGI 선교회" 실시간 생중계로 함께하실 수 있습니다.',
    ],
  },
  {
    id: 11,
    category: '공지',
    title: '2026 제3기 제자스쿨 (Disciple School) 안내',
    dateLabel: '훈련 공지 · 제자스쿨',
    summary: '천국을 증거하는 제자도를 훈련하는 제3기 디싸이플 스쿨의 모집 및 일정 안내입니다.',
    body: [
      '마태복음 4장 17절의 부르심을 따라 천국 복음을 증거하는 제자도를 배우는 PGI 제자스쿨 제3기 과정을 안내합니다.',
      '장소 여건상 소수 정예 선착순 접수 및 사전 인터뷰를 통해 참여자가 확정되며, 자세한 등록 절차는 훈련 프로그램 안내를 참조해 주세요.',
    ],
  },
  {
    id: 10,
    category: '공지',
    title: 'PGI 8기 기도말씀컨퍼런스 신청마감 및 안내',
    dateLabel: '지난 공지 · 기도말씀 컨퍼런스',
    summary: '성도님들의 뜨거운 기도와 관심 가운데 PGI 8기 기도말씀컨퍼런스 등록이 마감되었습니다.',
    body: [
      'PGI 8기 기도말씀컨퍼런스에 함께해 주신 모든 분들과 중보로 동참해 주신 성도님들께 깊이 감사드립니다.',
      '다음 회기 컨퍼런스 소식은 커뮤니티 공지를 통해 가장 먼저 전해드리겠습니다.',
    ],
  },
  {
    id: 8,
    category: '공지',
    title: 'PGI 여름·겨울 청청 복음캠프 안내',
    dateLabel: '캠프 안내 · 청청캠프',
    summary: '한국교회의 모든 청년과 청소년을 말씀으로 세우는 청청 복음캠프가 수원 빛과소금교회에서 열립니다.',
    body: [
      '세상의 혼탁한 가치관 속에서 하나님의 말씀(요일 2:14, 27)으로 진리를 분별하고 이기는 믿음의 세대를 일으키는 청청캠프입니다.',
      '장소: 경기도 수원시 권선구 동수원로 25번길 55 빛과소금교회 · 참가 대상: 한국교회 청년·청소년 누구나.',
    ],
  },
];

export const GALLERY_BASELINE_ITEMS: NoticeItem[] = [
  {
    id: 'gallery_jerusalem_2025',
    category: '갤러리',
    title: '이스라엘 단기선교 및 예루살렘 중보 예배',
    dateLabel: '2025.05.25',
    summary: '예루살렘의 평안을 구하며 현장 예배와 성지 중보 사역을 감당한 이스라엘 단기선교 기록입니다.',
    body: [
      '“예루살렘을 위하여 평안을 구하라 예루살렘을 사랑하는 자는 형통하리로다”(시 122:6)',
      '2025년 5월 이스라엘 현지에서 드려진 파송 및 현장 중보 예배의 은혜로운 현장입니다.',
    ],
    imageUrl: SITE_IMAGES.jerusalem,
    imageUrls: [
      SITE_IMAGES.jerusalem,
      SITE_IMAGES.heroJerusalem,
      '/src/assets/images/hero_jerusalem_sunrise_1795003103289.jpg',
    ],
  },
  {
    id: 'gallery_conference_2025',
    category: '갤러리',
    title: 'PGI 기도 말씀 컨퍼런스 말씀 연구',
    dateLabel: '2025.04.26',
    summary: '선지서 강해와 분향단의 기도로 시대를 분별하며 주님의 오심을 준비하는 컨퍼런스 현장입니다.',
    body: [
      '이사야, 미가, 에스겔, 다니엘, 스가랴, 요한계시록 말씀을 체계적으로 배우며 시대를 분별하는 기도 말씀 컨퍼런스 사역 기록입니다.',
    ],
    imageUrl: SITE_IMAGES.conference,
    imageUrls: [
      SITE_IMAGES.conference,
      '/src/assets/images/real_bible_prayer_hero_1795003475196.jpg',
      '/src/assets/images/hero_golden_incense_1795001086556.jpg',
    ],
  },
  {
    id: 'gallery_youth_2025',
    category: '갤러리',
    title: '청년 · 청소년 청청 복음캠프 워십',
    dateLabel: '2025.07.24',
    summary: '말씀 위에 견고히 서서 세상의 거짓을 이기는 믿음의 다음세대와 함께한 청청캠프 현장입니다.',
    body: [
      '한국교회의 청년과 청소년들이 말씀 강해와 찬양, 소그룹 교제를 통해 진리를 분별하는 믿음의 공동체로 세워졌습니다.',
    ],
    imageUrl: SITE_IMAGES.youth,
    imageUrls: [
      SITE_IMAGES.youth,
      '/src/assets/images/real_church_worship_hero_1795003474371.jpg',
      '/src/assets/images/hero_worship_sanctuary_1795003104350.jpg',
    ],
  },
  {
    id: 'gallery_tuesday_worship',
    category: '갤러리',
    title: '매주 화요 정기 토라포션 예배',
    dateLabel: '2024.11.18',
    summary: '매주 화요일 오전·오후에 모여 모세오경 토라포션을 배우고 분향단의 기도를 드리는 본당 예배입니다.',
    body: [
      '수원 빛과소금교회 PGI센터에서 매주 화요일 오전 10:30, 오후 1:30에 함께 예배하며 말씀을 나눕니다.',
    ],
    imageUrl: SITE_IMAGES.worship,
    imageUrls: [
      SITE_IMAGES.worship,
      '/src/assets/images/real_chapel_interior_hero_1795003490347.jpg',
      SITE_IMAGES.hero,
    ],
  },
  {
    id: 'gallery_sanctuary_prayer',
    category: '갤러리',
    title: '수원 PGI 선교회 성전 예배 및 기도회',
    dateLabel: '2025.01.07',
    summary: '복음 증거와 예배로 분향단의 기도를 채워 나가는 PGI 공동체의 정기 예배 모습입니다.',
    body: [
      '매주 화요예배와 목요 정기 기도회를 통해 한국교회와 이스라엘, 열방 선교지를 위해 기도의 향을 올리고 있습니다.',
    ],
    imageUrl: '/src/assets/images/real_church_worship_hero_1795003474371.jpg',
    imageUrls: [
      '/src/assets/images/real_church_worship_hero_1795003474371.jpg',
      '/src/assets/images/real_chapel_interior_hero_1795003490347.jpg',
    ],
  },
  {
    id: 'gallery_disciple_school',
    category: '갤러리',
    title: '디싸이플 스쿨(Disciple School) 말씀 양육',
    dateLabel: '2025.07.03',
    summary: '천국 복음을 증거하는 주의 제자이자 신부로 단장되는 집중 말씀 양육 사역 기록입니다.',
    body: [
      '마태복음 4장 17절의 부르심을 따라 깊은 말씀 묵상과 합숙 훈련으로 동역하는 제자스쿨 현장입니다.',
    ],
    imageUrl: '/src/assets/images/real_bible_prayer_hero_1795003475196.jpg',
    imageUrls: [
      '/src/assets/images/real_bible_prayer_hero_1795003475196.jpg',
      SITE_IMAGES.conference,
    ],
  },
];

export const GALLERY_ARCHIVES = [
  { year: '2025', title: '청청 복음캠프', category: '다음세대' },
  { year: '2025', title: '제2기 제자스쿨 (Disciple School)', category: '훈련' },
  { year: '2025', title: '이스라엘 단기선교 & 파송식', category: '열방선교' },
  { year: '2025', title: '제6기 기도 말씀 컨퍼런스', category: '훈련' },
  { year: '2025', title: '이집트 단기선교', category: '열방선교' },
  { year: '2024', title: '튀르키예 단기선교', category: '열방선교' },
  { year: '2024', title: '이스라엘 단기선교', category: '열방선교' },
  { year: '2023', title: '제3기 기도 컨퍼런스 & 케투빔 스쿨', category: '훈련' },
];
