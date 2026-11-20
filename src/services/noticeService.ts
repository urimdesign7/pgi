import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  GALLERY_BASELINE_ITEMS,
  NOTICES,
  type CommunityCategory,
  type NoticeCategory,
} from '../data/pgiData';

export const NOTICE_CONSTRAINTS = {
  TITLE_MIN: 2,
  TITLE_MAX: 120,
  CATEGORY_MAX: 40,
  DATE_MIN: 1,
  DATE_MAX: 30,
  SUMMARY_MIN: 2,
  SUMMARY_MAX: 240,
  CONTENT_MIN: 2,
  CONTENT_MAX: 5000,
  IMAGE_URL_MAX: 400000,
  MAX_GALLERY_IMAGES: 10,
  MAX_TOTAL_IMAGES_CHARS: 780000,
  IMAGE_URL_PATTERN:
    /^(https?:\/\/.+|\/.+|data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+)$/,
  AUTHOR_NAME_MIN: 1,
  AUTHOR_NAME_MAX: 60,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export const COMMUNITY_CATEGORIES: CommunityCategory[] = ['공지', '갤러리'];

export const ALLOWED_CATEGORIES: NoticeCategory[] = [
  '공지',
  '갤러리',
  '기도말씀 컨퍼런스',
  '화요예배',
  '제자스쿨',
  '청청캠프',
  '공지사항',
];

export interface FirestoreNotice {
  id: string;
  title: string;
  category: NoticeCategory;
  dateLabel: string;
  summary: string;
  content: string;
  imageUrl: string;
  imageUrls: string[];
  isPinned: boolean;
  isPublished: boolean;
  authorId: string;
  authorName: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface NoticeInput {
  title: string;
  category: NoticeCategory;
  dateLabel: string;
  summary: string;
  content: string;
  imageUrl: string;
  imageUrls: string[];
  isPinned: boolean;
  isPublished: boolean;
  authorName: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  displayName: string;
  addedBy: string;
}

function timestampToMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

function sortNotices(items: FirestoreNotice[]): FirestoreNotice[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.createdAtMs - a.createdAtMs;
  });
}

function normalizeImageUrlList(imageUrl: unknown, imageUrls: unknown): string[] {
  const list = Array.isArray(imageUrls)
    ? imageUrls
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (list.length > 0) {
    return Array.from(new Set(list)).slice(0, NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES);
  }
  const single = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  return single ? [single] : [];
}

function mapNoticeDoc(id: string, data: Record<string, unknown>): FirestoreNotice {
  const normalizedUrls = normalizeImageUrlList(data.imageUrl, data.imageUrls);
  const coverUrl =
    typeof data.imageUrl === 'string' && data.imageUrl.trim()
      ? data.imageUrl.trim()
      : (normalizedUrls[0] ?? '');

  return {
    id,
    title: String(data.title ?? ''),
    category: ALLOWED_CATEGORIES.includes(data.category as NoticeCategory)
      ? (data.category as NoticeCategory)
      : '공지',
    dateLabel: String(data.dateLabel ?? ''),
    summary: String(data.summary ?? ''),
    content: String(data.content ?? ''),
    imageUrl: coverUrl,
    imageUrls: normalizedUrls,
    isPinned: Boolean(data.isPinned),
    isPublished: Boolean(data.isPublished),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? 'PGI 선교회'),
    createdAtMs: timestampToMs(data.createdAt),
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

export function validateNoticeInput(input: NoticeInput): string | null {
  const title = input.title.trim();
  const dateLabel = input.dateLabel.trim();
  const summary = input.summary.trim();
  const content = input.content.trim();
  const authorName = input.authorName.trim();

  if (title.length < NOTICE_CONSTRAINTS.TITLE_MIN || title.length > NOTICE_CONSTRAINTS.TITLE_MAX) {
    return `제목은 ${NOTICE_CONSTRAINTS.TITLE_MIN}자 이상 ${NOTICE_CONSTRAINTS.TITLE_MAX}자 이하로 입력해 주세요.`;
  }
  if (!ALLOWED_CATEGORIES.includes(input.category)) {
    return '올바른 커뮤니티 카테고리를 선택해 주세요.';
  }
  if (
    dateLabel.length < NOTICE_CONSTRAINTS.DATE_MIN ||
    dateLabel.length > NOTICE_CONSTRAINTS.DATE_MAX
  ) {
    return `표시 날짜는 ${NOTICE_CONSTRAINTS.DATE_MIN}자 이상 ${NOTICE_CONSTRAINTS.DATE_MAX}자 이하로 입력해 주세요.`;
  }
  if (
    summary.length < NOTICE_CONSTRAINTS.SUMMARY_MIN ||
    summary.length > NOTICE_CONSTRAINTS.SUMMARY_MAX
  ) {
    return `요약 문구는 ${NOTICE_CONSTRAINTS.SUMMARY_MIN}자 이상 ${NOTICE_CONSTRAINTS.SUMMARY_MAX}자 이하로 입력해 주세요.`;
  }
  if (
    content.length < NOTICE_CONSTRAINTS.CONTENT_MIN ||
    content.length > NOTICE_CONSTRAINTS.CONTENT_MAX
  ) {
    return `본문 내용은 ${NOTICE_CONSTRAINTS.CONTENT_MIN}자 이상 ${NOTICE_CONSTRAINTS.CONTENT_MAX}자 이하로 입력해 주세요.`;
  }

  const rawUrls =
    input.imageUrls && input.imageUrls.length > 0
      ? input.imageUrls.map((u) => u.trim()).filter(Boolean)
      : input.imageUrl.trim()
        ? [input.imageUrl.trim()]
        : [];

  if (rawUrls.length > NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES) {
    return `사진은 최대 ${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장까지만 첨부할 수 있습니다.`;
  }

  let totalChars = 0;
  for (const url of rawUrls) {
    if (url.length > NOTICE_CONSTRAINTS.IMAGE_URL_MAX) {
      return '첨부 이미지 중 허용 용량을 초과한 사진이 있습니다. 더 작은 이미지를 선택해 주세요.';
    }
    if (!NOTICE_CONSTRAINTS.IMAGE_URL_PATTERN.test(url)) {
      return '올바른 이미지 주소(https://...) 또는 JPG/PNG/WEBP 이미지 파일을 사용해 주세요.';
    }
    totalChars += url.length;
  }

  if (totalChars > NOTICE_CONSTRAINTS.MAX_TOTAL_IMAGES_CHARS) {
    return '첨부된 사진 전체 용량이 데이터베이스 저장 한도를 초과했습니다. 사진 수를 줄이거나 외부 이미지 URL을 이용해 주세요.';
  }

  if (
    authorName.length < NOTICE_CONSTRAINTS.AUTHOR_NAME_MIN ||
    authorName.length > NOTICE_CONSTRAINTS.AUTHOR_NAME_MAX
  ) {
    return `작성자 표기명은 ${NOTICE_CONSTRAINTS.AUTHOR_NAME_MIN}자 이상 ${NOTICE_CONSTRAINTS.AUTHOR_NAME_MAX}자 이하로 입력해 주세요.`;
  }
  return null;
}

function sanitizeNoticeInput(input: NoticeInput): NoticeInput {
  const cleanUrls = normalizeImageUrlList(input.imageUrl, input.imageUrls).map((u) =>
    u.slice(0, NOTICE_CONSTRAINTS.IMAGE_URL_MAX)
  );
  return {
    title: input.title.trim().slice(0, NOTICE_CONSTRAINTS.TITLE_MAX),
    category: ALLOWED_CATEGORIES.includes(input.category) ? input.category : '공지',
    dateLabel: input.dateLabel.trim().slice(0, NOTICE_CONSTRAINTS.DATE_MAX),
    summary: input.summary.trim().slice(0, NOTICE_CONSTRAINTS.SUMMARY_MAX),
    content: input.content.trim().slice(0, NOTICE_CONSTRAINTS.CONTENT_MAX),
    imageUrl: cleanUrls[0] ?? '',
    imageUrls: cleanUrls,
    isPinned: Boolean(input.isPinned),
    isPublished: Boolean(input.isPublished),
    authorName: input.authorName.trim().slice(0, NOTICE_CONSTRAINTS.AUTHOR_NAME_MAX),
  };
}

export function subscribePublishedNotices(
  onData: (notices: FirestoreNotice[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'notices';
  const q = query(collection(db, path), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapNoticeDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortNotices(items));
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export function subscribeAdminNotices(
  isBootstrapped: boolean,
  onData: (notices: FirestoreNotice[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'notices';
  const targetQuery = isBootstrapped
    ? collection(db, path)
    : query(collection(db, path), where('isPublished', '==', true));

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapNoticeDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortNotices(items));
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  );
}

export async function createNotice(input: NoticeInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  const validationError = validateNoticeInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeNoticeInput(input);
  const id = `notice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `notices/${id}`;

  try {
    await setDoc(doc(db, 'notices', id), {
      ...sanitized,
      authorId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateNotice(id: string, input: NoticeInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!NOTICE_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 커뮤니티 ID입니다.');
  }
  const validationError = validateNoticeInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeNoticeInput(input);
  const path = `notices/${id}`;

  try {
    await updateDoc(doc(db, 'notices', id), {
      title: sanitized.title,
      category: sanitized.category,
      dateLabel: sanitized.dateLabel,
      summary: sanitized.summary,
      content: sanitized.content,
      imageUrl: sanitized.imageUrl,
      imageUrls: sanitized.imageUrls,
      isPinned: sanitized.isPinned,
      isPublished: sanitized.isPublished,
      authorName: sanitized.authorName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNotice(id: string): Promise<void> {
  if (!NOTICE_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 커뮤니티 ID입니다.');
  }
  const path = `notices/${id}`;
  try {
    await deleteDoc(doc(db, 'notices', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedBaselineNotices(): Promise<number> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }

  let count = 0;
  const baselineItems = [
    ...NOTICES.map((item) => ({ ...item, idKey: `seed_notice_${item.id}` })),
    ...GALLERY_BASELINE_ITEMS.map((item) => ({ ...item, idKey: `seed_${item.id}` })),
  ];

  for (const item of baselineItems) {
    const id = item.idKey;
    const path = `notices/${id}`;
    const imageUrls = normalizeImageUrlList(item.imageUrl, item.imageUrls);
    try {
      await setDoc(doc(db, 'notices', id), {
        title: item.title.slice(0, NOTICE_CONSTRAINTS.TITLE_MAX),
        category: item.category,
        dateLabel: item.dateLabel.slice(0, NOTICE_CONSTRAINTS.DATE_MAX),
        summary: item.summary.slice(0, NOTICE_CONSTRAINTS.SUMMARY_MAX),
        content: item.body.join('\n\n').slice(0, NOTICE_CONSTRAINTS.CONTENT_MAX),
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
        isPinned: item.id === 14,
        isPublished: true,
        authorId: user.uid,
        authorName: 'PGI 선교회 사무국',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count += 1;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
  return count;
}

export async function resolveAdminStatus(user: User | null): Promise<{
  isAdmin: boolean;
  isBootstrapped: boolean;
}> {
  if (!user || !user.emailVerified) {
    return { isAdmin: false, isBootstrapped: false };
  }
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) {
    return { isAdmin: true, isBootstrapped: true };
  }

  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return { isAdmin: snap.exists(), isBootstrapped: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchAddedAdmins(): Promise<AdminRecord[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? ''),
        addedBy: String(data.addedBy ?? ''),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addAdminRecord(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  const trimmedUid = uid.trim();
  const trimmedEmail = email.trim();
  const trimmedName = displayName.trim();

  if (!NOTICE_CONSTRAINTS.ID_PATTERN.test(trimmedUid) || trimmedUid.length > 128) {
    throw new Error('올바른 Firebase UID 형식을 입력해 주세요.');
  }
  if (trimmedEmail.length < 3 || trimmedEmail.length > 120) {
    throw new Error('이메일 주소를 3자 이상 120자 이하로 입력해 주세요.');
  }
  if (trimmedName.length < 1 || trimmedName.length > 60) {
    throw new Error('관리자 이름을 입력해 주세요.');
  }

  const path = `admins/${trimmedUid}`;
  try {
    await setDoc(doc(db, 'admins', trimmedUid), {
      email: trimmedEmail,
      displayName: trimmedName,
      addedBy: user.uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeAdminRecord(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
