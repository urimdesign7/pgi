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

export const INQUIRY_STATUSES = ['대기중', '확인됨', '답변완료'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_CONSTRAINTS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  CONTACT_MIN: 4,
  CONTACT_MAX: 100,
  TOPIC_MIN: 2,
  TOPIC_MAX: 80,
  MESSAGE_MIN: 5,
  MESSAGE_MAX: 2000,
  ADMIN_NOTE_MAX: 1000,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
} as const;

export interface FirestoreInquiry {
  id: string;
  name: string;
  contact: string;
  topic: string;
  message: string;
  status: InquiryStatus;
  adminNote: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface InquirySubmitInput {
  name: string;
  contact: string;
  topic: string;
  message: string;
}

function timestampToMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

function normalizeStatus(status: unknown): InquiryStatus {
  return INQUIRY_STATUSES.includes(status as InquiryStatus)
    ? (status as InquiryStatus)
    : '대기중';
}

function mapInquiryDoc(id: string, data: Record<string, unknown>): FirestoreInquiry {
  return {
    id,
    name: String(data.name ?? ''),
    contact: String(data.contact ?? ''),
    topic: String(data.topic ?? ''),
    message: String(data.message ?? ''),
    status: normalizeStatus(data.status),
    adminNote: typeof data.adminNote === 'string' ? data.adminNote : '',
    createdAtMs: timestampToMs(data.createdAt),
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

export function validateInquiryInput(input: InquirySubmitInput): string | null {
  const name = input.name.trim();
  const contact = input.contact.trim();
  const topic = input.topic.trim();
  const message = input.message.trim();

  if (name.length < INQUIRY_CONSTRAINTS.NAME_MIN || name.length > INQUIRY_CONSTRAINTS.NAME_MAX) {
    return '성함 또는 교회/단체명을 두 글자 이상 입력해 주세요.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = contact.replace(/[^0-9]/g, '');
  if (
    contact.length < INQUIRY_CONSTRAINTS.CONTACT_MIN ||
    contact.length > INQUIRY_CONSTRAINTS.CONTACT_MAX ||
    (!emailRegex.test(contact) && phoneDigits.length < 9)
  ) {
    return '연락 가능한 전화번호 또는 이메일 주소를 정확히 입력해 주세요.';
  }

  if (topic.length < INQUIRY_CONSTRAINTS.TOPIC_MIN || topic.length > INQUIRY_CONSTRAINTS.TOPIC_MAX) {
    return '문의 구분을 선택해 주세요.';
  }

  if (
    message.length < INQUIRY_CONSTRAINTS.MESSAGE_MIN ||
    message.length > INQUIRY_CONSTRAINTS.MESSAGE_MAX
  ) {
    return `문의 내용을 ${INQUIRY_CONSTRAINTS.MESSAGE_MIN}자 이상 ${INQUIRY_CONSTRAINTS.MESSAGE_MAX}자 이하로 작성해 주세요.`;
  }

  return null;
}

export async function createInquiry(input: InquirySubmitInput): Promise<string> {
  const validationError = validateInquiryInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const id = `inquiry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `inquiries/${id}`;

  try {
    await setDoc(doc(db, 'inquiries', id), {
      name: input.name.trim().slice(0, INQUIRY_CONSTRAINTS.NAME_MAX),
      contact: input.contact.trim().slice(0, INQUIRY_CONSTRAINTS.CONTACT_MAX),
      topic: input.topic.trim().slice(0, INQUIRY_CONSTRAINTS.TOPIC_MAX),
      message: input.message.trim().slice(0, INQUIRY_CONSTRAINTS.MESSAGE_MAX),
      status: '대기중',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeInquiries(
  isBootstrapped: boolean,
  onData: (inquiries: FirestoreInquiry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!isBootstrapped) {
    onData([]);
    return () => {};
  }

  const path = 'inquiries';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapInquiryDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
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

export async function updateInquiryAdminState(
  id: string,
  status: InquiryStatus,
  adminNote: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!INQUIRY_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 문의 ID입니다.');
  }
  if (!INQUIRY_STATUSES.includes(status)) {
    throw new Error('올바르지 않은 처리 상태입니다.');
  }

  const cleanNote = adminNote.trim().slice(0, INQUIRY_CONSTRAINTS.ADMIN_NOTE_MAX);
  const path = `inquiries/${id}`;

  try {
    await updateDoc(doc(db, 'inquiries', id), {
      status,
      adminNote: cleanNote,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('관리자 로그인이 필요합니다.');
  }
  if (!INQUIRY_CONSTRAINTS.ID_PATTERN.test(id)) {
    throw new Error('올바르지 않은 문의 ID입니다.');
  }
  const path = `inquiries/${id}`;
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
