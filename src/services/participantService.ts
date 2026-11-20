import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export const PARTICIPANT_CONSTRAINTS = {
  PHOTO_URL_MAX: 400000,
  PHOTO_URL_PATTERN:
    /^(https?:\/\/.+|\/.+|data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+)$/,
  NAME_MIN: 1,
  NAME_MAX: 60,
  TELEGRAM_MAX: 64,
  COHORT_MIN: 1,
  COHORT_MAX: 40,
  PHONE_MAX: 30,
  SHORT_ADDRESS_MAX: 120,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export interface FirestoreParticipant {
  id: string;
  photoUrl: string;
  name: string;
  telegramId: string;
  cohort: string;
  phone: string;
  shortAddress: string;
  authorId: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ParticipantInput {
  photoUrl: string;
  name: string;
  telegramId: string;
  cohort: string;
  phone: string;
  shortAddress: string;
}

function timestampToMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

function sortParticipants(items: FirestoreParticipant[]): FirestoreParticipant[] {
  return [...items].sort((a, b) => {
    if (b.createdAtMs !== a.createdAtMs) {
      return b.createdAtMs - a.createdAtMs;
    }
    return a.name.localeCompare(b.name, 'ko-KR');
  });
}

function mapParticipantDoc(id: string, data: Record<string, unknown>): FirestoreParticipant {
  return {
    id,
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : '',
    name: String(data.name ?? ''),
    telegramId: typeof data.telegramId === 'string' ? data.telegramId : '',
    cohort: String(data.cohort ?? ''),
    phone: typeof data.phone === 'string' ? data.phone : '',
    shortAddress: typeof data.shortAddress === 'string' ? data.shortAddress : '',
    authorId: String(data.authorId ?? ''),
    createdAtMs: timestampToMs(data.createdAt),
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

export function validateParticipantInput(input: ParticipantInput): string | null {
  const photoUrl = input.photoUrl.trim();
  const name = input.name.trim();
  const telegramId = input.telegramId.trim();
  const cohort = input.cohort.trim();
  const phone = input.phone.trim();
  const shortAddress = input.shortAddress.trim();

  if (photoUrl.length > PARTICIPANT_CONSTRAINTS.PHOTO_URL_MAX) {
    return '참가자 사진 용량이 허용 한도를 초과했습니다. 더 작은 이미지를 선택해 주세요.';
  }
  if (photoUrl.length > 0 && !PARTICIPANT_CONSTRAINTS.PHOTO_URL_PATTERN.test(photoUrl)) {
    return '올바른 사진 주소(https://...) 또는 JPG/PNG/WEBP 이미지 파일을 사용해 주세요.';
  }
  if (
    name.length < PARTICIPANT_CONSTRAINTS.NAME_MIN ||
    name.length > PARTICIPANT_CONSTRAINTS.NAME_MAX
  ) {
    return `이름은 ${PARTICIPANT_CONSTRAINTS.NAME_MIN}자 이상 ${PARTICIPANT_CONSTRAINTS.NAME_MAX}자 이하로 입력해 주세요.`;
  }
  if (telegramId.length > PARTICIPANT_CONSTRAINTS.TELEGRAM_MAX) {
    return `텔레아이디는 ${PARTICIPANT_CONSTRAINTS.TELEGRAM_MAX}자 이하로 입력해 주세요.`;
  }
  if (
    cohort.length < PARTICIPANT_CONSTRAINTS.COHORT_MIN ||
    cohort.length > PARTICIPANT_CONSTRAINTS.COHORT_MAX
  ) {
    return `참여기수는 ${PARTICIPANT_CONSTRAINTS.COHORT_MIN}자 이상 ${PARTICIPANT_CONSTRAINTS.COHORT_MAX}자 이하로 입력해 주세요.`;
  }
  if (phone.length > PARTICIPANT_CONSTRAINTS.PHONE_MAX) {
    return `전화번호는 ${PARTICIPANT_CONSTRAINTS.PHONE_MAX}자 이하로 입력해 주세요.`;
  }
  if (shortAddress.length > PARTICIPANT_CONSTRAINTS.SHORT_ADDRESS_MAX) {
    return `약식주소는 ${PARTICIPANT_CONSTRAINTS.SHORT_ADDRESS_MAX}자 이하로 입력해 주세요.`;
  }
  return null;
}

function sanitizeParticipantInput(input: ParticipantInput): ParticipantInput {
  return {
    photoUrl: input.photoUrl.trim().slice(0, PARTICIPANT_CONSTRAINTS.PHOTO_URL_MAX),
    name: input.name.trim().slice(0, PARTICIPANT_CONSTRAINTS.NAME_MAX),
    telegramId: input.telegramId.trim().slice(0, PARTICIPANT_CONSTRAINTS.TELEGRAM_MAX),
    cohort: input.cohort.trim().slice(0, PARTICIPANT_CONSTRAINTS.COHORT_MAX),
    phone: input.phone.trim().slice(0, PARTICIPANT_CONSTRAINTS.PHONE_MAX),
    shortAddress: input.shortAddress.trim().slice(0, PARTICIPANT_CONSTRAINTS.SHORT_ADDRESS_MAX),
  };
}

export function subscribeParticipants(
  isBootstrapped: boolean,
  onData: (participants: FirestoreParticipant[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!isBootstrapped) {
    onData([]);
    return () => {};
  }

  const path = 'participants';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapParticipantDoc(d.id, d.data() as Record<string, unknown>)
      );
      onData(sortParticipants(items));
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

export async function createParticipant(input: ParticipantInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  const validationError = validateParticipantInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeParticipantInput(input);
  const id = `participant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `participants/${id}`;

  try {
    await setDoc(doc(db, 'participants', id), {
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

export async function updateParticipant(id: string, input: ParticipantInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!PARTICIPANT_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 참가자 ID입니다.');
  }
  const validationError = validateParticipantInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const sanitized = sanitizeParticipantInput(input);
  const path = `participants/${id}`;

  try {
    await updateDoc(doc(db, 'participants', id), {
      photoUrl: sanitized.photoUrl,
      name: sanitized.name,
      telegramId: sanitized.telegramId,
      cohort: sanitized.cohort,
      phone: sanitized.phone,
      shortAddress: sanitized.shortAddress,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteParticipant(id: string): Promise<void> {
  if (!PARTICIPANT_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 참가자 ID입니다.');
  }
  const path = `participants/${id}`;
  try {
    await deleteDoc(doc(db, 'participants', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
