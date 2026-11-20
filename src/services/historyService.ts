import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { HISTORY_TIMELINE, type HistoryYear } from '../data/pgiData';

export const HISTORY_CONSTRAINTS = {
  YEAR_LENGTH: 4,
  YEAR_PATTERN: /^(19|20)[0-9]{2}$/,
  DATE_MIN: 1,
  DATE_MAX: 40,
  TITLE_MIN: 2,
  TITLE_MAX: 140,
  LOCATION_MAX: 100,
  SORT_MIN: 0,
  SORT_MAX: 99999999,
  AUTHOR_NAME_MIN: 1,
  AUTHOR_NAME_MAX: 60,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export interface FirestoreHistory {
  id: string;
  year: string;
  date: string;
  title: string;
  location: string;
  sortOrder: number;
  isPublished: boolean;
  authorId: string;
  authorName: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface HistoryInput {
  year: string;
  date: string;
  title: string;
  location: string;
  sortOrder?: number;
  isPublished: boolean;
  authorName: string;
}

function timestampToMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

export function computeSortOrderFromDate(dateLabel: string): number {
  const trimmed = dateLabel.trim();
  const mmdd = trimmed.match(/(?:^|\.)(\d{1,2})\.(\d{1,2})/);
  if (mmdd) {
    const month = Math.min(12, Math.max(1, Number(mmdd[1])));
    const day = Math.min(31, Math.max(1, Number(mmdd[2])));
    return month * 100 + day;
  }
  const monthOnly = trimmed.match(/(\d{1,2})\s*(?:–|-|~)?\s*\d{0,2}\s*월?/);
  if (monthOnly) {
    const month = Math.min(12, Math.max(1, Number(monthOnly[1])));
    return month * 100;
  }
  return 0;
}

function sortHistories(items: FirestoreHistory[]): FirestoreHistory[] {
  return [...items].sort((a, b) => {
    const yearDiff = Number(b.year) - Number(a.year);
    if (yearDiff !== 0) return yearDiff;
    if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
    return b.createdAtMs - a.createdAtMs;
  });
}

function mapHistoryDoc(id: string, data: Record<string, unknown>): FirestoreHistory {
  return {
    id,
    year: String(data.year ?? ''),
    date: String(data.date ?? ''),
    title: String(data.title ?? ''),
    location: String(data.location ?? ''),
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
    isPublished: Boolean(data.isPublished),
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? 'PGI 선교회 사무국'),
    createdAtMs: timestampToMs(data.createdAt),
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

export function validateHistoryInput(input: HistoryInput): string | null {
  const year = input.year.trim();
  const date = input.date.trim();
  const title = input.title.trim();
  const location = input.location.trim();
  const authorName = input.authorName.trim();

  if (!HISTORY_CONSTRAINTS.YEAR_PATTERN.test(year)) {
    return '연도는 4자리 숫자(예: 2026)로 정확히 입력해 주세요.';
  }
  if (date.length < HISTORY_CONSTRAINTS.DATE_MIN || date.length > HISTORY_CONSTRAINTS.DATE_MAX) {
    return `날짜/기간은 ${HISTORY_CONSTRAINTS.DATE_MIN}자 이상 ${HISTORY_CONSTRAINTS.DATE_MAX}자 이하로 입력해 주세요.`;
  }
  if (title.length < HISTORY_CONSTRAINTS.TITLE_MIN || title.length > HISTORY_CONSTRAINTS.TITLE_MAX) {
    return `연혁 내용은 ${HISTORY_CONSTRAINTS.TITLE_MIN}자 이상 ${HISTORY_CONSTRAINTS.TITLE_MAX}자 이하로 입력해 주세요.`;
  }
  if (location.length > HISTORY_CONSTRAINTS.LOCATION_MAX) {
    return `장소는 ${HISTORY_CONSTRAINTS.LOCATION_MAX}자 이하로 입력해 주세요.`;
  }
  if (
    authorName.length < HISTORY_CONSTRAINTS.AUTHOR_NAME_MIN ||
    authorName.length > HISTORY_CONSTRAINTS.AUTHOR_NAME_MAX
  ) {
    return `작성자 표기명은 ${HISTORY_CONSTRAINTS.AUTHOR_NAME_MIN}자 이상 ${HISTORY_CONSTRAINTS.AUTHOR_NAME_MAX}자 이하로 입력해 주세요.`;
  }
  return null;
}

function sanitizeHistoryInput(input: HistoryInput) {
  const date = input.date.trim().slice(0, HISTORY_CONSTRAINTS.DATE_MAX);
  const rawOrder =
    typeof input.sortOrder === 'number' && !Number.isNaN(input.sortOrder)
      ? Math.round(input.sortOrder)
      : computeSortOrderFromDate(date);
  const sortOrder = Math.min(
    HISTORY_CONSTRAINTS.SORT_MAX,
    Math.max(HISTORY_CONSTRAINTS.SORT_MIN, rawOrder)
  );

  return {
    year: input.year.trim().slice(0, HISTORY_CONSTRAINTS.YEAR_LENGTH),
    date,
    title: input.title.trim().slice(0, HISTORY_CONSTRAINTS.TITLE_MAX),
    location: input.location.trim().slice(0, HISTORY_CONSTRAINTS.LOCATION_MAX),
    sortOrder,
    isPublished: Boolean(input.isPublished),
    authorName: input.authorName.trim().slice(0, HISTORY_CONSTRAINTS.AUTHOR_NAME_MAX),
  };
}

export function subscribePublishedHistories(
  onData: (histories: FirestoreHistory[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'histories';
  const q = query(collection(db, path), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapHistoryDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortHistories(items));
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

export function subscribeAdminHistories(
  isBootstrapped: boolean,
  onData: (histories: FirestoreHistory[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'histories';
  const targetQuery = isBootstrapped
    ? collection(db, path)
    : query(collection(db, path), where('isPublished', '==', true));

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapHistoryDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortHistories(items));
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

export async function createHistory(input: HistoryInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  const validationError = validateHistoryInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeHistoryInput(input);
  const id = `history_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `histories/${id}`;

  try {
    await setDoc(doc(db, 'histories', id), {
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

export async function updateHistory(id: string, input: HistoryInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!HISTORY_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 연혁 ID입니다.');
  }
  const validationError = validateHistoryInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeHistoryInput(input);
  const path = `histories/${id}`;

  try {
    await updateDoc(doc(db, 'histories', id), {
      year: sanitized.year,
      date: sanitized.date,
      title: sanitized.title,
      location: sanitized.location,
      sortOrder: sanitized.sortOrder,
      isPublished: sanitized.isPublished,
      authorName: sanitized.authorName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteHistory(id: string): Promise<void> {
  if (!HISTORY_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 연혁 ID입니다.');
  }
  const path = `histories/${id}`;
  try {
    await deleteDoc(doc(db, 'histories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedBaselineHistories(): Promise<number> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }

  let count = 0;
  for (const yearGroup of HISTORY_TIMELINE) {
    const totalInYear = yearGroup.events.length;
    for (let i = 0; i < totalInYear; i++) {
      const ev = yearGroup.events[i];
      const id = `seed_history_${yearGroup.year}_${i + 1}`;
      const path = `histories/${id}`;
      // Preserve exact top-to-bottom order of HISTORY_TIMELINE within each year
      const fallbackOrder = (totalInYear - i) * 100;
      const computed = computeSortOrderFromDate(ev.date);
      const sortOrder = computed > 0 ? computed : fallbackOrder;

      try {
        await setDoc(doc(db, 'histories', id), {
          year: yearGroup.year,
          date: ev.date.slice(0, HISTORY_CONSTRAINTS.DATE_MAX),
          title: ev.title.slice(0, HISTORY_CONSTRAINTS.TITLE_MAX),
          location: (ev.location ?? '').slice(0, HISTORY_CONSTRAINTS.LOCATION_MAX),
          sortOrder,
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
  }
  return count;
}

export function buildHistoryTimelineGroups(liveHistories: FirestoreHistory[] | null): HistoryYear[] {
  if (!liveHistories || liveHistories.length === 0) {
    return HISTORY_TIMELINE;
  }

  const hasSeededBaseline = liveHistories.some((h) => h.id.startsWith('seed_history_'));
  const byYear = new Map<
    string,
    { date: string; title: string; location?: string; sortOrder: number; createdAtMs: number }[]
  >();

  // If baseline hasn't been explicitly imported into Firestore yet, preserve 2022-2025 baseline items
  // and merge newly added Firestore items seamlessly without hiding existing history.
  if (!hasSeededBaseline) {
    for (const group of HISTORY_TIMELINE) {
      const list = byYear.get(group.year) ?? [];
      group.events.forEach((ev, idx) => {
        const computed = computeSortOrderFromDate(ev.date);
        list.push({
          date: ev.date,
          title: ev.title,
          location: ev.location,
          sortOrder: computed > 0 ? computed : (group.events.length - idx) * 100,
          createdAtMs: 0,
        });
      });
      byYear.set(group.year, list);
    }
  }

  for (const item of liveHistories) {
    const list = byYear.get(item.year) ?? [];
    list.push({
      date: item.date,
      title: item.title,
      location: item.location ? item.location : undefined,
      sortOrder: item.sortOrder,
      createdAtMs: item.createdAtMs,
    });
    byYear.set(item.year, list);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => Number(b) - Number(a));
  return years.map((year) => {
    const events = (byYear.get(year) ?? [])
      .sort((a, b) => {
        if (b.sortOrder !== a.sortOrder) return b.sortOrder - a.sortOrder;
        return b.createdAtMs - a.createdAtMs;
      })
      .map(({ date, title, location }) => ({
        date,
        title,
        ...(location ? { location } : {}),
      }));
    return { year, events };
  });
}
