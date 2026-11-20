import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MapPin,
  Phone,
  Pin,
  Plus,
  Search,
  Send,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, googleProvider } from '../lib/firebase';
import {
  compressGalleryImageFile,
  compressNoticeImageFile,
  compressParticipantPhotoFile,
} from '../lib/imageUtils';
import {
  addAdminRecord,
  COMMUNITY_CATEGORIES,
  createNotice,
  deleteNotice,
  fetchAddedAdmins,
  NOTICE_CONSTRAINTS,
  removeAdminRecord,
  resolveAdminStatus,
  seedBaselineNotices,
  subscribeAdminNotices,
  updateNotice,
  validateNoticeInput,
  type AdminRecord,
  type FirestoreNotice,
  type NoticeInput,
} from '../services/noticeService';
import {
  computeSortOrderFromDate,
  createHistory,
  deleteHistory,
  HISTORY_CONSTRAINTS,
  seedBaselineHistories,
  subscribeAdminHistories,
  updateHistory,
  validateHistoryInput,
  type FirestoreHistory,
  type HistoryInput,
} from '../services/historyService';
import {
  createParticipant,
  deleteParticipant,
  PARTICIPANT_CONSTRAINTS,
  subscribeParticipants,
  updateParticipant,
  validateParticipantInput,
  type FirestoreParticipant,
  type ParticipantInput,
} from '../services/participantService';
import {
  getNoticeImages,
  normalizeCommunityCategory,
  type CommunityCategory,
  type NoticeCategory,
} from '../data/pgiData';

export type AdminSectionTab = 'notices' | 'history' | 'participants';

interface AdminPageProps {
  initialTab?: AdminSectionTab;
  onChangeTab?: (tab: AdminSectionTab) => void;
  onBackToSite: () => void;
}

function getTodayLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function getCurrentMonthDayLabel(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${m}.${d}`;
}

function createEmptyNoticeForm(authorName: string): NoticeInput {
  return {
    title: '',
    category: '공지',
    dateLabel: getTodayLabel(),
    summary: '',
    content: '',
    imageUrl: '',
    imageUrls: [],
    isPinned: false,
    isPublished: true,
    authorName: authorName || 'PGI 선교회 사무국',
  };
}

function createEmptyHistoryForm(authorName: string): HistoryInput {
  return {
    year: String(new Date().getFullYear()),
    date: getCurrentMonthDayLabel(),
    title: '',
    location: '',
    isPublished: true,
    authorName: authorName || 'PGI 선교회 사무국',
  };
}

function createEmptyParticipantForm(): ParticipantInput {
  return {
    photoUrl: '',
    name: '',
    telegramId: '',
    cohort: '',
    phone: '',
    shortAddress: '',
  };
}

const PRESET_YEARS = ['2026', '2025', '2024', '2023', '2022'];

export function AdminPage({ initialTab = 'notices', onChangeTab, onBackToSite }: AdminPageProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminSectionTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSwitchTab = (tab: AdminSectionTab) => {
    setActiveTab(tab);
    setConfirmDeleteNoticeId(null);
    setConfirmDeleteHistoryId(null);
    setConfirmDeleteParticipantId(null);
    onChangeTab?.(tab);
  };

  // Notices / Community State
  const [notices, setNotices] = useState<FirestoreNotice[]>([]);
  const [noticeListLoading, setNoticeListLoading] = useState(false);
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<'all' | CommunityCategory>('all');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeInput>(() =>
    createEmptyNoticeForm('PGI 선교회 사무국')
  );
  const [noticeFormError, setNoticeFormError] = useState('');
  const [noticeFormSuccess, setNoticeFormSuccess] = useState('');
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [confirmDeleteNoticeId, setConfirmDeleteNoticeId] = useState<string | null>(null);
  const [isSeedingNotices, setIsSeedingNotices] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageMetaNote, setImageMetaNote] = useState('');

  // History State
  const [histories, setHistories] = useState<FirestoreHistory[]>([]);
  const [historyListLoading, setHistoryListLoading] = useState(false);
  const [historyYearFilter, setHistoryYearFilter] = useState<string>('all');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [historyForm, setHistoryForm] = useState<HistoryInput>(() =>
    createEmptyHistoryForm('PGI 선교회 사무국')
  );
  const [historyFormError, setHistoryFormError] = useState('');
  const [historyFormSuccess, setHistoryFormSuccess] = useState('');
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [confirmDeleteHistoryId, setConfirmDeleteHistoryId] = useState<string | null>(null);
  const [isSeedingHistories, setIsSeedingHistories] = useState(false);

  // Participants State (Bootstrapped Admin PII Isolation)
  const [participants, setParticipants] = useState<FirestoreParticipant[]>([]);
  const [participantListLoading, setParticipantListLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantCohortFilter, setParticipantCohortFilter] = useState<string>('all');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [participantForm, setParticipantForm] = useState<ParticipantInput>(() =>
    createEmptyParticipantForm()
  );
  const [participantFormError, setParticipantFormError] = useState('');
  const [participantFormSuccess, setParticipantFormSuccess] = useState('');
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);
  const [confirmDeleteParticipantId, setConfirmDeleteParticipantId] = useState<string | null>(null);
  const [participantPhotoMode, setParticipantPhotoMode] = useState<'upload' | 'url'>('upload');
  const [isProcessingParticipantPhoto, setIsProcessingParticipantPhoto] = useState(false);
  const [participantPhotoMetaNote, setParticipantPhotoMetaNote] = useState('');

  // Admin Management State (Bootstrapped Admin Only)
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [addedAdmins, setAddedAdmins] = useState<AdminRecord[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  // Track Auth & Admin Status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthError('');
      if (!currentUser) {
        setIsAdmin(false);
        setIsBootstrapped(false);
        setAuthLoading(false);
        return;
      }

      try {
        const status = await resolveAdminStatus(currentUser);
        setIsAdmin(status.isAdmin);
        setIsBootstrapped(status.isBootstrapped);
        setNoticeForm((prev) => ({
          ...prev,
          authorName: prev.authorName || currentUser.displayName || 'PGI 선교회 사무국',
        }));
        setHistoryForm((prev) => ({
          ...prev,
          authorName: prev.authorName || currentUser.displayName || 'PGI 선교회 사무국',
        }));
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : '관리자 권한 확인 중 오류가 발생했습니다.'
        );
        setIsAdmin(false);
        setIsBootstrapped(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Notices, Histories & Participants when authenticated as Admin
  useEffect(() => {
    if (!isAdmin) {
      setNotices([]);
      setHistories([]);
      setParticipants([]);
      return;
    }

    setNoticeListLoading(true);
    const unsubNotices = subscribeAdminNotices(
      isBootstrapped,
      (items) => {
        setNotices(items);
        setNoticeListLoading(false);
      },
      (err) => {
        setNoticeFormError(
          err instanceof Error ? err.message : '공지사항 목록을 불러오지 못했습니다.'
        );
        setNoticeListLoading(false);
      }
    );

    setHistoryListLoading(true);
    const unsubHistories = subscribeAdminHistories(
      isBootstrapped,
      (items) => {
        setHistories(items);
        setHistoryListLoading(false);
      },
      (err) => {
        setHistoryFormError(
          err instanceof Error ? err.message : '연혁 목록을 불러오지 못했습니다.'
        );
        setHistoryListLoading(false);
      }
    );

    let unsubParticipants = () => {};
    if (isBootstrapped) {
      setParticipantListLoading(true);
      unsubParticipants = subscribeParticipants(
        true,
        (items) => {
          setParticipants(items);
          setParticipantListLoading(false);
        },
        (err) => {
          setParticipantFormError(
            err instanceof Error ? err.message : '참가자 목록을 불러오지 못했습니다.'
          );
          setParticipantListLoading(false);
        }
      );
    } else {
      setParticipants([]);
      setParticipantListLoading(false);
    }

    return () => {
      unsubNotices();
      unsubHistories();
      unsubParticipants();
    };
  }, [isAdmin, isBootstrapped]);

  // Load added admins list for Bootstrapped Admin
  useEffect(() => {
    if (!isBootstrapped || !showAdminPanel) return;
    void fetchAddedAdmins()
      .then(setAddedAdmins)
      .catch((err) => {
        setAdminActionMsg(err instanceof Error ? err.message : '목록 조회 오류');
      });
  }, [isBootstrapped, showAdminPanel]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google 로그인 중 문제가 발생했습니다.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setEditingNoticeId(null);
    setEditingHistoryId(null);
    setEditingParticipantId(null);
    setNoticeForm(createEmptyNoticeForm('PGI 선교회 사무국'));
    setHistoryForm(createEmptyHistoryForm('PGI 선교회 사무국'));
    setParticipantForm(createEmptyParticipantForm());
    setParticipantPhotoMetaNote('');
  };

  const handleCopyUid = async () => {
    if (!user?.uid) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      setCopiedUid(false);
    }
  };

  // --- Notice Handlers ---
  const handleStartCreateNotice = () => {
    setEditingNoticeId(null);
    setNoticeForm(createEmptyNoticeForm(user?.displayName || 'PGI 선교회 사무국'));
    setNoticeFormError('');
    setNoticeFormSuccess('');
    setImageMetaNote('');
    setGalleryUrlInput('');
    setImageInputMode('upload');
  };

  const handleStartEditNotice = (notice: FirestoreNotice) => {
    const existingImages = getNoticeImages(notice);
    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title,
      category: normalizeCommunityCategory(notice.category),
      dateLabel: notice.dateLabel,
      summary: notice.summary,
      content: notice.content,
      imageUrl: existingImages[0] ?? '',
      imageUrls: existingImages,
      isPinned: notice.isPinned,
      isPublished: notice.isPublished,
      authorName: notice.authorName,
    });
    setNoticeFormError('');
    setNoticeFormSuccess('');
    setGalleryUrlInput('');
    setImageMetaNote(
      existingImages.length > 1
        ? `기존 갤러리 사진 ${existingImages.length}장 첨부됨`
        : existingImages[0]
          ? '기존 첨부 이미지'
          : ''
    );
    setImageInputMode(
      existingImages[0] && !existingImages[0].startsWith('data:image/') ? 'url' : 'upload'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNoticeImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    setNoticeFormError('');
    setImageMetaNote('');
    const isGallery = normalizeCommunityCategory(noticeForm.category) === '갤러리';

    if (!isGallery) {
      const file = selectedFiles[0];
      setIsProcessingImage(true);
      try {
        const result = await compressNoticeImageFile(file);
        setNoticeForm((prev) => ({
          ...prev,
          imageUrl: result.dataUrl,
          imageUrls: [result.dataUrl],
        }));
        setImageMetaNote(
          `자동 최적화 완료 · 약 ${result.approxKb} KB (${result.width}×${result.height})`
        );
      } catch (err) {
        setNoticeFormError(
          err instanceof Error ? err.message : '이미지 처리 중 문제가 발생했습니다.'
        );
      } finally {
        setIsProcessingImage(false);
      }
      return;
    }

    // Gallery multi-photo up to 10 slides
    const currentImages = [...(noticeForm.imageUrls ?? [])];
    const remainingSlots = NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES - currentImages.length;
    if (remainingSlots <= 0) {
      setNoticeFormError(
        `갤러리 사진은 최대 ${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장까지 첨부할 수 있습니다.`
      );
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    const skippedCount = selectedFiles.length - filesToProcess.length;

    setIsProcessingImage(true);
    try {
      const nextImages = [...currentImages];
      let totalChars = nextImages.reduce((sum, u) => sum + u.length, 0);
      let addedCount = 0;

      for (const file of filesToProcess) {
        const result = await compressGalleryImageFile(file);
        if (totalChars + result.dataUrl.length > NOTICE_CONSTRAINTS.MAX_TOTAL_IMAGES_CHARS) {
          setNoticeFormError(
            `문서 저장 용량 한도에 도달하여 ${addedCount}장까지만 추가되었습니다.`
          );
          break;
        }
        nextImages.push(result.dataUrl);
        totalChars += result.dataUrl.length;
        addedCount += 1;
      }

      setNoticeForm((prev) => ({
        ...prev,
        imageUrls: nextImages,
        imageUrl: nextImages[0] ?? '',
      }));

      if (addedCount > 0) {
        const approxTotalKb = Math.round((totalChars * 0.75) / 1024);
        const skipNote = skippedCount > 0 ? ` (최대 10장 제한으로 ${skippedCount}장 제외)` : '';
        setImageMetaNote(
          `${addedCount}장 추가 완료 · 현재 ${nextImages.length}/${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장 (약 ${approxTotalKb} KB)${skipNote}`
        );
      }
    } catch (err) {
      setNoticeFormError(
        err instanceof Error ? err.message : '갤러리 사진 처리 중 문제가 발생했습니다.'
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleAddGalleryImageUrl = () => {
    setNoticeFormError('');
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;

    if (trimmed.length > NOTICE_CONSTRAINTS.IMAGE_URL_MAX) {
      setNoticeFormError('이미지 URL 길이가 너무 깁니다.');
      return;
    }

    const isAllowed =
      trimmed.startsWith('https://') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('/assets/');
    if (!isAllowed) {
      setNoticeFormError('https:// 또는 http://로 시작하는 이미지 URL을 입력해 주세요.');
      return;
    }

    const currentImages = [...(noticeForm.imageUrls ?? [])];
    if (currentImages.includes(trimmed)) {
      setNoticeFormError('이미 목록에 추가된 사진 URL입니다.');
      return;
    }
    if (currentImages.length >= NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES) {
      setNoticeFormError(
        `갤러리 사진은 최대 ${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장까지 등록할 수 있습니다.`
      );
      return;
    }

    const totalChars = currentImages.reduce((sum, u) => sum + u.length, 0) + trimmed.length;
    if (totalChars > NOTICE_CONSTRAINTS.MAX_TOTAL_IMAGES_CHARS) {
      setNoticeFormError('이미지 총 데이터 용량이 한도를 초과했습니다.');
      return;
    }

    const nextImages = [...currentImages, trimmed];
    setNoticeForm((prev) => ({
      ...prev,
      imageUrls: nextImages,
      imageUrl: nextImages[0] ?? '',
    }));
    setGalleryUrlInput('');
    setImageMetaNote(
      `URL 사진 추가됨 · 현재 ${nextImages.length}/${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장`
    );
  };

  const handleMoveGalleryImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    const currentImages = [...(noticeForm.imageUrls ?? [])];
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;
    const [moved] = currentImages.splice(index, 1);
    currentImages.splice(targetIndex, 0, moved);
    setNoticeForm((prev) => ({
      ...prev,
      imageUrls: currentImages,
      imageUrl: currentImages[0] ?? '',
    }));
  };

  const handleRemoveGalleryImageAt = (index: number) => {
    const currentImages = [...(noticeForm.imageUrls ?? [])];
    currentImages.splice(index, 1);
    setNoticeForm((prev) => ({
      ...prev,
      imageUrls: currentImages,
      imageUrl: currentImages[0] ?? '',
    }));
    setImageMetaNote(
      currentImages.length > 0
        ? `현재 ${currentImages.length}/${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장`
        : ''
    );
  };

  const handleRemoveNoticeImage = () => {
    setNoticeForm((prev) => ({ ...prev, imageUrl: '', imageUrls: [] }));
    setImageMetaNote('');
  };

  const handleSubmitNotice = async (e: FormEvent) => {
    e.preventDefault();
    setNoticeFormError('');
    setNoticeFormSuccess('');

    const validationError = validateNoticeInput(noticeForm);
    if (validationError) {
      setNoticeFormError(validationError);
      return;
    }

    setIsSavingNotice(true);
    try {
      if (editingNoticeId) {
        await updateNotice(editingNoticeId, noticeForm);
        setNoticeFormSuccess('커뮤니티 게시글이 수정되었습니다.');
      } else {
        await createNotice(noticeForm);
        setNoticeFormSuccess('새 커뮤니티 게시글이 등록되었습니다.');
        setNoticeForm(createEmptyNoticeForm(noticeForm.authorName));
        setImageMetaNote('');
      }
      setEditingNoticeId(null);
    } catch (err) {
      setNoticeFormError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleConfirmDeleteNotice = async (id: string) => {
    setNoticeFormError('');
    setNoticeFormSuccess('');
    try {
      await deleteNotice(id);
      if (editingNoticeId === id) {
        handleStartCreateNotice();
      }
      setConfirmDeleteNoticeId(null);
      setNoticeFormSuccess('게시글이 삭제되었습니다.');
    } catch (err) {
      setNoticeFormError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSeedInitialNotices = async () => {
    setNoticeFormError('');
    setNoticeFormSuccess('');
    setIsSeedingNotices(true);
    try {
      const count = await seedBaselineNotices();
      setNoticeFormSuccess(`기본 공지 및 갤러리 ${count}건을 데이터베이스에 등록했습니다.`);
    } catch (err) {
      setNoticeFormError(
        err instanceof Error ? err.message : '초기 게시글 등록 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSeedingNotices(false);
    }
  };

  // --- History Handlers ---
  const handleStartCreateHistory = () => {
    setEditingHistoryId(null);
    setHistoryForm(createEmptyHistoryForm(user?.displayName || 'PGI 선교회 사무국'));
    setHistoryFormError('');
    setHistoryFormSuccess('');
  };

  const handleStartEditHistory = (item: FirestoreHistory) => {
    setEditingHistoryId(item.id);
    setHistoryForm({
      year: item.year,
      date: item.date,
      title: item.title,
      location: item.location,
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
      authorName: item.authorName,
    });
    setHistoryFormError('');
    setHistoryFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitHistory = async (e: FormEvent) => {
    e.preventDefault();
    setHistoryFormError('');
    setHistoryFormSuccess('');

    const validationError = validateHistoryInput(historyForm);
    if (validationError) {
      setHistoryFormError(validationError);
      return;
    }

    setIsSavingHistory(true);
    try {
      const payload: HistoryInput = {
        ...historyForm,
        sortOrder: computeSortOrderFromDate(historyForm.date),
      };

      if (editingHistoryId) {
        await updateHistory(editingHistoryId, payload);
        setHistoryFormSuccess('연혁 항목이 수정되었습니다.');
      } else {
        await createHistory(payload);
        setHistoryFormSuccess(
          `${historyForm.year}년 연혁에 새 항목이 추가되었습니다. 홈페이지에 즉시 반영됩니다.`
        );
        setHistoryForm((prev) => ({
          ...createEmptyHistoryForm(prev.authorName),
          year: prev.year,
        }));
      }
      setEditingHistoryId(null);
    } catch (err) {
      setHistoryFormError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingHistory(false);
    }
  };

  const handleConfirmDeleteHistory = async (id: string) => {
    setHistoryFormError('');
    setHistoryFormSuccess('');
    try {
      await deleteHistory(id);
      if (editingHistoryId === id) {
        handleStartCreateHistory();
      }
      setConfirmDeleteHistoryId(null);
      setHistoryFormSuccess('연혁 항목이 삭제되었습니다.');
    } catch (err) {
      setHistoryFormError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSeedInitialHistories = async () => {
    setHistoryFormError('');
    setHistoryFormSuccess('');
    setIsSeedingHistories(true);
    try {
      const count = await seedBaselineHistories();
      setHistoryFormSuccess(`기존 연혁(2022–2025) ${count}건을 데이터베이스로 불러왔습니다.`);
    } catch (err) {
      setHistoryFormError(
        err instanceof Error ? err.message : '기존 연혁 불러오기 중 오류가 발생했습니다.'
      );
    } finally {
      setIsSeedingHistories(false);
    }
  };

  // --- Participant Handlers ---
  const handleStartCreateParticipant = () => {
    setEditingParticipantId(null);
    setParticipantForm(createEmptyParticipantForm());
    setParticipantFormError('');
    setParticipantFormSuccess('');
    setParticipantPhotoMetaNote('');
    setParticipantPhotoMode('upload');
  };

  const handleStartEditParticipant = (item: FirestoreParticipant) => {
    setEditingParticipantId(item.id);
    setParticipantForm({
      photoUrl: item.photoUrl ?? '',
      name: item.name,
      telegramId: item.telegramId ?? '',
      cohort: item.cohort,
      phone: item.phone ?? '',
      shortAddress: item.shortAddress ?? '',
    });
    setParticipantFormError('');
    setParticipantFormSuccess('');
    setParticipantPhotoMetaNote(item.photoUrl ? '기존 등록 사진' : '');
    setParticipantPhotoMode(
      item.photoUrl && !item.photoUrl.startsWith('data:image/') ? 'url' : 'upload'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleParticipantPhotoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setParticipantFormError('');
    setParticipantPhotoMetaNote('');
    setIsProcessingParticipantPhoto(true);
    try {
      const result = await compressParticipantPhotoFile(file);
      setParticipantForm((prev) => ({ ...prev, photoUrl: result.dataUrl }));
      setParticipantPhotoMetaNote(
        `자동 최적화 완료 · 약 ${result.approxKb} KB (${result.width}×${result.height})`
      );
    } catch (err) {
      setParticipantFormError(
        err instanceof Error ? err.message : '사진 처리 중 문제가 발생했습니다.'
      );
    } finally {
      setIsProcessingParticipantPhoto(false);
    }
  };

  const handleRemoveParticipantPhoto = () => {
    setParticipantForm((prev) => ({ ...prev, photoUrl: '' }));
    setParticipantPhotoMetaNote('');
  };

  const handleSubmitParticipant = async (e: FormEvent) => {
    e.preventDefault();
    setParticipantFormError('');
    setParticipantFormSuccess('');

    const validationError = validateParticipantInput(participantForm);
    if (validationError) {
      setParticipantFormError(validationError);
      return;
    }

    setIsSavingParticipant(true);
    try {
      if (editingParticipantId) {
        await updateParticipant(editingParticipantId, participantForm);
        setParticipantFormSuccess(`${participantForm.name.trim()}님의 정보가 수정되었습니다.`);
      } else {
        await createParticipant(participantForm);
        setParticipantFormSuccess(`${participantForm.name.trim()}님이 참가자 명단에 등록되었습니다.`);
        setParticipantForm((prev) => ({
          ...createEmptyParticipantForm(),
          cohort: prev.cohort,
        }));
        setParticipantPhotoMetaNote('');
      }
      setEditingParticipantId(null);
    } catch (err) {
      setParticipantFormError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingParticipant(false);
    }
  };

  const handleConfirmDeleteParticipant = async (id: string) => {
    setParticipantFormError('');
    setParticipantFormSuccess('');
    try {
      await deleteParticipant(id);
      if (editingParticipantId === id) {
        handleStartCreateParticipant();
      }
      setConfirmDeleteParticipantId(null);
      setParticipantFormSuccess('참가자 정보가 삭제되었습니다.');
    } catch (err) {
      setParticipantFormError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  // --- Admin RBAC Handlers ---
  const handleAddAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setAdminActionMsg('');
    try {
      await addAdminRecord(newAdminUid, newAdminEmail, newAdminName);
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      const list = await fetchAddedAdmins();
      setAddedAdmins(list);
      setAdminActionMsg('관리자 권한이 등록되었습니다.');
    } catch (err) {
      setAdminActionMsg(err instanceof Error ? err.message : '관리자 추가 실패');
    }
  };

  const handleRemoveAdmin = async (uid: string) => {
    setAdminActionMsg('');
    try {
      await removeAdminRecord(uid);
      const list = await fetchAddedAdmins();
      setAddedAdmins(list);
      setAdminActionMsg('관리자 권한이 해제되었습니다.');
    } catch (err) {
      setAdminActionMsg(err instanceof Error ? err.message : '관리자 삭제 실패');
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (
      noticeCategoryFilter !== 'all' &&
      normalizeCommunityCategory(n.category) !== noticeCategoryFilter
    ) {
      return false;
    }
    if (noticeStatusFilter === 'published') return n.isPublished;
    if (noticeStatusFilter === 'draft') return !n.isPublished;
    return true;
  });

  const historyYears = Array.from(new Set(histories.map((h) => h.year))).sort(
    (a, b) => Number(b) - Number(a)
  );
  const effectiveHistoryYear =
    historyYearFilter !== 'all' && !historyYears.includes(historyYearFilter)
      ? 'all'
      : historyYearFilter;
  const filteredHistories =
    effectiveHistoryYear === 'all'
      ? histories
      : histories.filter((h) => h.year === effectiveHistoryYear);

  const groupedHistories = Array.from(new Set(filteredHistories.map((h) => h.year)))
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      year,
      items: filteredHistories.filter((h) => h.year === year),
    }));

  const hasSeededHistories = histories.some((h) => h.id.startsWith('seed_history_'));

  const participantCohorts = Array.from(
    new Set(participants.map((p) => p.cohort.trim()).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a, 'ko-KR', { numeric: true }));

  const effectiveParticipantCohort =
    participantCohortFilter !== 'all' && !participantCohorts.includes(participantCohortFilter)
      ? 'all'
      : participantCohortFilter;

  const participantSearchLower = participantSearch.trim().toLowerCase();
  const filteredParticipants = participants.filter((p) => {
    if (effectiveParticipantCohort !== 'all' && p.cohort !== effectiveParticipantCohort) {
      return false;
    }
    if (!participantSearchLower) return true;
    return (
      p.name.toLowerCase().includes(participantSearchLower) ||
      p.cohort.toLowerCase().includes(participantSearchLower) ||
      p.telegramId.toLowerCase().includes(participantSearchLower) ||
      p.phone.toLowerCase().includes(participantSearchLower) ||
      p.shortAddress.toLowerCase().includes(participantSearchLower)
    );
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col">
      {/* Clean 3-Zone Admin Header */}
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>홈페이지로 돌아가기</span>
            </button>
          </div>

          <span className="font-editorial text-base sm:text-lg font-semibold text-[#1C1917] whitespace-nowrap shrink-0">
            PGI 선교회 관리자 페이지
          </span>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#EBE6DF] hover:bg-[#E2DCD2] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>관리자 로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Loading State */}
        {authLoading && (
          <div className="py-20 text-center text-sm text-[#78716C]">
            관리자 인증 정보를 확인하고 있습니다...
          </div>
        )}

        {/* Unauthenticated Sign-In Gate */}
        {!authLoading && !user && (
          <div className="max-w-lg mx-auto my-8 p-8 bg-[#F3EFE6] border border-stone-200 rounded-xl space-y-6">
            <div>
              <p className="text-xs font-medium text-[#9A6B22] mb-2">
                PGI 선교회 관리자 전용
              </p>
              <h1 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-2">
                커뮤니티 · 연혁 · 참가자 관리 로그인
              </h1>
              <p className="text-sm text-[#57534E] leading-relaxed">
                선교회 커뮤니티(공지·갤러리) 작성·수정, 걸어온 길(연혁) 편집 및 참가자 관리는
                승인된 관리자 계정으로 로그인한 후 이용할 수 있습니다.
              </p>
            </div>

            {authError && (
              <p role="alert" className="text-xs font-medium text-[#9A3412]">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google 계정으로 관리자 로그인</span>
            </button>
          </div>
        )}

        {/* Authenticated Non-Admin Notice */}
        {!authLoading && user && !isAdmin && (
          <div className="max-w-lg mx-auto my-8 p-8 bg-[#F3EFE6] border border-stone-200 rounded-xl space-y-5">
            <div>
              <p className="text-xs font-medium text-[#9A3412] mb-2">접근 권한 필요</p>
              <h1 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-2">
                관리자 권한이 등록되지 않은 계정입니다
              </h1>
              <p className="text-sm text-[#57534E] leading-relaxed">
                현재 로그인된 계정(<strong className="text-[#1C1917]">{user.email}</strong>)에는
                관리자 권한이 없습니다. 대표 관리자({BOOTSTRAPPED_ADMIN_EMAIL})에게 아래 UID 등록을
                요청하거나 관리자 계정으로 다시 로그인해 주세요.
              </p>
            </div>

            <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded-lg space-y-2">
              <p className="text-xs text-[#78716C]">내 사용자 UID</p>
              <div className="flex items-center justify-between gap-2">
                <code className="font-tabular text-xs text-[#1C1917] break-all">{user.uid}</code>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#EBE6DF] hover:bg-[#E2DCD2] rounded transition-colors cursor-pointer shrink-0"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#9A6B22]" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>UID 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer"
              >
                다른 계정으로 로그인
              </button>
              <button
                type="button"
                onClick={onBackToSite}
                className="px-4 py-2 text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        )}

        {/* Authenticated Admin Workspace */}
        {!authLoading && user && isAdmin && (
          <div className="space-y-8">
            {/* Admin Account Bar & Primary Section Switcher */}
            <div className="pb-6 border-b border-stone-200 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div>
                <p className="text-xs text-[#78716C] mb-1">
                  관리자 계정 · {user.email}
                  {isBootstrapped ? ' (대표 관리자)' : ' (지정 관리자)'}
                </p>
                <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                  {activeTab === 'notices'
                    ? '커뮤니티(공지 · 갤러리) 관리'
                    : activeTab === 'history'
                      ? '선교회 연혁 추가 및 관리'
                      : '선교회 참가자 등록 및 관리'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Workspace Section Tabs */}
                <div
                  role="tablist"
                  aria-label="관리 메뉴 선택"
                  className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'notices'}
                    onClick={() => handleSwitchTab('notices')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'notices'
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#9A6B22]" />
                    <span>커뮤니티 관리</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'history'}
                    onClick={() => handleSwitchTab('history')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'history'
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-[#9A6B22]" />
                    <span>연혁 관리</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'participants'}
                    onClick={() => handleSwitchTab('participants')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'participants'
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-[#9A6B22]" />
                    <span>참가자 관리</span>
                  </button>
                </div>

                {activeTab === 'notices' && notices.length === 0 && (
                  <button
                    type="button"
                    disabled={isSeedingNotices}
                    onClick={handleSeedInitialNotices}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] border border-stone-300 hover:border-stone-400 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#9A6B22]" />
                    <span>{isSeedingNotices ? '등록 중...' : '기본 공지·갤러리 불러오기'}</span>
                  </button>
                )}

                {activeTab === 'history' && !hasSeededHistories && (
                  <button
                    type="button"
                    disabled={isSeedingHistories}
                    onClick={handleSeedInitialHistories}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] border border-stone-300 hover:border-stone-400 rounded-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#9A6B22]" />
                    <span>
                      {isSeedingHistories ? '불러오는 중...' : '기존 연혁(2022–2025) 불러오기'}
                    </span>
                  </button>
                )}

                {isBootstrapped && (
                  <button
                    type="button"
                    onClick={() => setShowAdminPanel((v) => !v)}
                    aria-expanded={showAdminPanel}
                    aria-label={showAdminPanel ? '관리자 권한 관리 닫기' : '관리자 권한 관리'}
                    title={showAdminPanel ? '관리자 권한 관리 닫기' : '관리자 권한 관리'}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B22] ${
                      showAdminPanel
                        ? 'bg-[#1C1917] text-[#D6A656]'
                        : 'bg-[#EBE6DF] hover:bg-[#E2DCD2] text-[#9A6B22]'
                    }`}
                  >
                    <Shield className="w-[18px] h-[18px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Secondary Admin RBAC Panel (Bootstrapped Admin Only) */}
            {isBootstrapped && showAdminPanel && (
              <section className="p-6 bg-[#F3EFE6] border border-stone-200 rounded-xl space-y-5">
                <div>
                  <h2 className="font-editorial text-xl font-semibold text-[#1C1917] mb-1">
                    추가 관리자 권한 설정
                  </h2>
                  <p className="text-xs text-[#57534E]">
                    공지사항과 연혁을 함께 관리할 사역자의 Google 계정 UID를 등록하거나 해제할 수
                    있습니다.
                  </p>
                </div>

                <form
                  onSubmit={handleAddAdmin}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">사용자 UID</label>
                    <input
                      type="text"
                      value={newAdminUid}
                      onChange={(e) => setNewAdminUid(e.target.value)}
                      placeholder="Firebase UID"
                      className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">이메일</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#57534E] mb-1">이름 / 직분</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="예: 김OO 간사"
                      className="w-full px-3 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-md"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>관리자 추가</span>
                  </button>
                </form>

                {adminActionMsg && (
                  <p className="text-xs font-medium text-[#9A6B22]">{adminActionMsg}</p>
                )}

                {addedAdmins.length > 0 && (
                  <ul className="divide-y divide-stone-200 border-t border-stone-200 pt-2">
                    {addedAdmins.map((adm) => (
                      <li
                        key={adm.uid}
                        className="py-2.5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <span className="font-medium text-[#1C1917]">{adm.displayName}</span>
                          <span className="text-[#78716C] mx-1.5">·</span>
                          <span className="text-[#57534E]">{adm.email}</span>
                          <span className="text-[#78716C] mx-1.5">·</span>
                          <code className="font-tabular text-[#78716C]">{adm.uid}</code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(adm.uid)}
                          className="text-xs text-[#9A3412] hover:underline cursor-pointer"
                        >
                          권한 해제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* TAB 1: NOTICES WORKSPACE */}
            {activeTab === 'notices' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 5 Cols: Notice Create / Edit Form */}
                <form
                  onSubmit={handleSubmitNotice}
                  className="lg:col-span-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-xl p-6 space-y-4 lg:sticky lg:top-24"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <h2 className="font-editorial text-xl font-semibold text-[#1C1917]">
                      {editingNoticeId ? '커뮤니티 글 수정' : '새 커뮤니티 글 작성'}
                    </h2>
                    {editingNoticeId && (
                      <button
                        type="button"
                        onClick={handleStartCreateNotice}
                        className="text-xs font-medium text-[#9A6B22] hover:underline cursor-pointer"
                      >
                        새 작성으로 전환
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="notice-title" className="font-medium text-[#292524]">
                        제목
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {noticeForm.title.length}/{NOTICE_CONSTRAINTS.TITLE_MAX}
                      </span>
                    </div>
                    <input
                      id="notice-title"
                      type="text"
                      maxLength={NOTICE_CONSTRAINTS.TITLE_MAX}
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                      placeholder={
                        noticeForm.category === '갤러리'
                          ? '예: 2026 PGI 봄 단기선교 및 예배 현장'
                          : '예: 2026 PGI 10기 기도말씀 컨퍼런스 신청 안내'
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="notice-category"
                        className="block text-xs font-medium text-[#292524] mb-1"
                      >
                        카테고리
                      </label>
                      <select
                        id="notice-category"
                        value={normalizeCommunityCategory(noticeForm.category)}
                        onChange={(e) => {
                          const nextCat = e.target.value as NoticeCategory;
                          const isNextGallery = normalizeCommunityCategory(nextCat) === '갤러리';
                          setNoticeForm((prev) => ({
                            ...prev,
                            category: nextCat,
                            imageUrls: isNextGallery
                              ? prev.imageUrls
                              : prev.imageUrl
                                ? [prev.imageUrl]
                                : [],
                          }));
                        }}
                        className="w-full px-3 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                      >
                        {COMMUNITY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="notice-date"
                        className="block text-xs font-medium text-[#292524] mb-1"
                      >
                        표시 날짜
                      </label>
                      <input
                        id="notice-date"
                        type="text"
                        maxLength={NOTICE_CONSTRAINTS.DATE_MAX}
                        value={noticeForm.dateLabel}
                        onChange={(e) =>
                          setNoticeForm({ ...noticeForm, dateLabel: e.target.value })
                        }
                        placeholder="예: 2026.11.18"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] font-tabular focus:outline-none focus:border-[#9A6B22]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notice-author"
                      className="block text-xs font-medium text-[#292524] mb-1"
                    >
                      작성자 표기명
                    </label>
                    <input
                      id="notice-author"
                      type="text"
                      maxLength={NOTICE_CONSTRAINTS.AUTHOR_NAME_MAX}
                      value={noticeForm.authorName}
                      onChange={(e) =>
                        setNoticeForm({ ...noticeForm, authorName: e.target.value })
                      }
                      placeholder="예: PGI 선교회 사무국"
                      className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="notice-summary" className="font-medium text-[#292524]">
                        한 줄 요약
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {noticeForm.summary.length}/{NOTICE_CONSTRAINTS.SUMMARY_MAX}
                      </span>
                    </div>
                    <input
                      id="notice-summary"
                      type="text"
                      maxLength={NOTICE_CONSTRAINTS.SUMMARY_MAX}
                      value={noticeForm.summary}
                      onChange={(e) => setNoticeForm({ ...noticeForm, summary: e.target.value })}
                      placeholder="목록 화면에 표시될 핵심 요약 문구"
                      className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  {/* Image Attachment (1 photo for 공지, up to 10 photos for 갤러리) */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#292524] inline-flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#9A6B22]" />
                        <span>
                          {normalizeCommunityCategory(noticeForm.category) === '갤러리'
                            ? `갤러리 사진 첨부 (${noticeForm.imageUrls?.length ?? 0}/${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장)`
                            : '첨부 이미지 (선택 · 포스터/안내문)'}
                        </span>
                      </span>

                      <div className="inline-flex items-center gap-1 p-0.5 bg-[#EBE6DF] rounded-md">
                        <button
                          type="button"
                          onClick={() => setImageInputMode('upload')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                            imageInputMode === 'upload'
                              ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                              : 'text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          파일 업로드
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('url')}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                            imageInputMode === 'url'
                              ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                              : 'text-[#57534E] hover:text-[#1C1917]'
                          }`}
                        >
                          이미지 URL
                        </button>
                      </div>
                    </div>

                    {normalizeCommunityCategory(noticeForm.category) === '갤러리' ? (
                      <>
                        {imageInputMode === 'upload' ? (
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#FBF9F5] border border-dashed border-stone-300 hover:border-[#9A6B22] rounded-md text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer">
                            <Upload className="w-4 h-4 text-[#9A6B22]" />
                            <span>
                              {isProcessingImage
                                ? '갤러리 사진 최적화 중...'
                                : (noticeForm.imageUrls?.length ?? 0) >=
                                    NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES
                                  ? `최대 ${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장 모두 선택됨`
                                  : `사진 여러 장 추가 선택 (최대 ${NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES}장)`}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleNoticeImageFileChange}
                              disabled={
                                isProcessingImage ||
                                (noticeForm.imageUrls?.length ?? 0) >=
                                  NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES
                              }
                              className="sr-only"
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              id="gallery-image-url-input"
                              type="url"
                              maxLength={NOTICE_CONSTRAINTS.IMAGE_URL_MAX}
                              value={galleryUrlInput}
                              onChange={(e) => setGalleryUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGalleryImageUrl();
                                }
                              }}
                              placeholder="https://example.com/photo.jpg"
                              className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                            />
                            <button
                              type="button"
                              onClick={handleAddGalleryImageUrl}
                              disabled={
                                (noticeForm.imageUrls?.length ?? 0) >=
                                NOTICE_CONSTRAINTS.MAX_GALLERY_IMAGES
                              }
                              className="px-3 py-2 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                            >
                              사진 추가
                            </button>
                          </div>
                        )}

                        {imageMetaNote && (
                          <p className="text-[11px] font-tabular text-[#78716C]">{imageMetaNote}</p>
                        )}

                        {(noticeForm.imageUrls?.length ?? 0) > 0 && (
                          <div className="p-2.5 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-2.5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(noticeForm.imageUrls ?? []).map((src, idx, arr) => (
                                <div
                                  key={`gallery-slide-edit-${idx}`}
                                  className="border border-stone-200 rounded bg-[#F3EFE6] overflow-hidden flex flex-col"
                                >
                                  <div className="relative aspect-[4/3] bg-[#EBE6DF] overflow-hidden">
                                    <img
                                      src={src}
                                      alt={`슬라이드 ${idx + 1}`}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-tabular font-semibold bg-[#1C1917]/80 text-[#FBF9F5] rounded">
                                      {String(idx + 1).padStart(2, '0')}
                                      {idx === 0 ? ' 대표' : ''}
                                    </span>
                                  </div>
                                  <div className="px-1.5 py-1 bg-[#FBF9F5] border-t border-stone-200 flex items-center justify-between gap-1">
                                    <div className="inline-flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryImage(idx, -1)}
                                        disabled={idx === 0}
                                        aria-label={`${idx + 1}번 사진 앞으로 이동`}
                                        className="p-1 text-[#57534E] hover:text-[#1C1917] disabled:opacity-30 cursor-pointer"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryImage(idx, 1)}
                                        disabled={idx === arr.length - 1}
                                        aria-label={`${idx + 1}번 사진 뒤로 이동`}
                                        className="p-1 text-[#57534E] hover:text-[#1C1917] disabled:opacity-30 cursor-pointer"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveGalleryImageAt(idx)}
                                      aria-label={`${idx + 1}번 사진 삭제`}
                                      className="p-1 text-[#9A3412] hover:bg-[#9A3412]/10 rounded cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-1 border-t border-stone-200">
                              <span>화살표로 슬라이드 순서를 조정할 수 있습니다.</span>
                              <button
                                type="button"
                                onClick={handleRemoveNoticeImage}
                                className="text-[#9A3412] hover:underline font-medium cursor-pointer shrink-0 whitespace-nowrap"
                              >
                                전체 비우기
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {imageInputMode === 'upload' ? (
                          <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#FBF9F5] border border-dashed border-stone-300 hover:border-[#9A6B22] rounded-md text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer">
                            <Upload className="w-4 h-4 text-[#9A6B22]" />
                            <span>
                              {isProcessingImage
                                ? '이미지 최적화 중...'
                                : noticeForm.imageUrl
                                  ? '다른 이미지 파일로 변경하기'
                                  : '이미지 파일 선택 (JPG · PNG · WEBP)'}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleNoticeImageFileChange}
                              disabled={isProcessingImage}
                              className="sr-only"
                            />
                          </label>
                        ) : (
                          <input
                            id="notice-image-url"
                            type="url"
                            maxLength={NOTICE_CONSTRAINTS.IMAGE_URL_MAX}
                            value={noticeForm.imageUrl.startsWith('data:') ? '' : noticeForm.imageUrl}
                            onChange={(e) => {
                              const urlVal = e.target.value;
                              setNoticeForm({
                                ...noticeForm,
                                imageUrl: urlVal,
                                imageUrls: urlVal ? [urlVal] : [],
                              });
                              setImageMetaNote('');
                            }}
                            placeholder="https://example.com/poster.jpg"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                          />
                        )}

                        {noticeForm.imageUrl && (
                          <div className="p-2.5 bg-[#FBF9F5] border border-stone-200 rounded-md space-y-2">
                            <div className="relative bg-[#F3EFE6] rounded overflow-hidden flex items-center justify-center">
                              <img
                                src={noticeForm.imageUrl}
                                alt="첨부 이미지 미리보기"
                                referrerPolicy="no-referrer"
                                className="w-full max-h-48 object-contain"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 text-[11px] text-[#78716C]">
                              <span className="truncate font-tabular">
                                {imageMetaNote || '이미지 URL 첨부됨'}
                              </span>
                              <button
                                type="button"
                                onClick={handleRemoveNoticeImage}
                                className="inline-flex items-center gap-1 text-[#9A3412] hover:underline font-medium cursor-pointer shrink-0 whitespace-nowrap"
                              >
                                <X className="w-3 h-3" />
                                <span>이미지 제거</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="notice-content" className="font-medium text-[#292524]">
                        상세 본문 (줄바꿈으로 문단 구분)
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {noticeForm.content.length}/{NOTICE_CONSTRAINTS.CONTENT_MAX}
                      </span>
                    </div>
                    <textarea
                      id="notice-content"
                      rows={7}
                      maxLength={NOTICE_CONSTRAINTS.CONTENT_MAX}
                      value={noticeForm.content}
                      onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                      placeholder={
                        noticeForm.category === '갤러리'
                          ? '사역 현장 소개와 은혜의 기록을 입력해 주세요.'
                          : '일정, 장소, 참여 안내 등 공지사항 본문 전체를 입력해 주세요.'
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22] resize-y"
                    />
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-6 text-xs text-[#292524]">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeForm.isPinned}
                        onChange={(e) =>
                          setNoticeForm({ ...noticeForm, isPinned: e.target.checked })
                        }
                        className="w-4 h-4 accent-[#9A6B22] rounded"
                      />
                      <span>목록 최상단 고정</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noticeForm.isPublished}
                        onChange={(e) =>
                          setNoticeForm({ ...noticeForm, isPublished: e.target.checked })
                        }
                        className="w-4 h-4 accent-[#1C1917] rounded"
                      />
                      <span>홈페이지 즉시 공개</span>
                    </label>
                  </div>

                  {noticeFormError && (
                    <p role="alert" className="text-xs font-medium text-[#9A3412]">
                      {noticeFormError}
                    </p>
                  )}
                  {noticeFormSuccess && (
                    <p role="status" className="text-xs font-medium text-[#9A6B22]">
                      {noticeFormSuccess}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingNotice}
                      className="flex-1 py-2.5 px-5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNotice
                        ? '저장 중...'
                        : editingNoticeId
                          ? '수정 사항 저장'
                          : '게시글 등록하기'}
                    </button>
                    {editingNoticeId && (
                      <button
                        type="button"
                        onClick={handleStartCreateNotice}
                        className="py-2.5 px-4 text-sm font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EBE6DF] rounded-md transition-colors cursor-pointer"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>

                {/* Right 7 Cols: Live Firestore Community List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                    <p className="text-sm font-medium text-[#1C1917] font-tabular">
                      등록된 커뮤니티 글 ({filteredNotices.length}건)
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg">
                        {(
                          [
                            { id: 'all', label: '전체' },
                            { id: '공지', label: '공지' },
                            { id: '갤러리', label: '갤러리' },
                          ] as const
                        ).map((catTab) => (
                          <button
                            key={catTab.id}
                            type="button"
                            onClick={() => setNoticeCategoryFilter(catTab.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              noticeCategoryFilter === catTab.id
                                ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                                : 'text-[#57534E] hover:text-[#1C1917]'
                            }`}
                          >
                            {catTab.label}
                          </button>
                        ))}
                      </div>

                      {isBootstrapped && (
                        <div className="inline-flex items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg">
                          {(
                            [
                              { id: 'all', label: '전체상태' },
                              { id: 'published', label: '공개' },
                              { id: 'draft', label: '비공개' },
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setNoticeStatusFilter(tab.id)}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                noticeStatusFilter === tab.id
                                  ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                                  : 'text-[#57534E] hover:text-[#1C1917]'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {noticeListLoading ? (
                    <p className="py-12 text-center text-sm text-[#78716C]">
                      커뮤니티 목록을 불러오는 중입니다...
                    </p>
                  ) : filteredNotices.length === 0 ? (
                    <div className="p-8 bg-[#F3EFE6]/60 border border-stone-200 rounded-xl text-center space-y-3">
                      <p className="text-sm text-[#57534E]">
                        등록된 커뮤니티 게시글이 없습니다.
                      </p>
                      <p className="text-xs text-[#78716C]">
                        왼쪽 양식에서 ‘공지’ 또는 ‘갤러리’ 게시글을 작성하거나 상단의 ‘기본 공지·갤러리 불러오기’ 버튼을 눌러 시작하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl bg-[#FBF9F5]">
                      {filteredNotices.map((notice) => {
                        const noticeImages = getNoticeImages(notice);
                        const thumbSrc = noticeImages[0];
                        return (
                        <div
                          key={notice.id}
                          className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {thumbSrc && (
                              <div className="w-16 h-12 rounded-md border border-stone-200 bg-[#F3EFE6] overflow-hidden shrink-0 mt-0.5">
                                <img
                                  src={thumbSrc}
                                  alt={notice.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                                {notice.isPinned && (
                                  <>
                                    <span className="inline-flex items-center gap-1 font-medium text-[#9A6B22]">
                                      <Pin className="w-3 h-3" />
                                      상단고정
                                    </span>
                                    <span aria-hidden="true">·</span>
                                  </>
                                )}
                                <span className="font-medium text-[#1C1917]">
                                  {normalizeCommunityCategory(notice.category)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-tabular">{notice.dateLabel}</span>
                                {noticeImages.length > 1 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-tabular text-[#9A6B22] font-medium">
                                      사진 {noticeImages.length}장
                                    </span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  {notice.isPublished ? (
                                    <>
                                      <Eye className="w-3 h-3 text-[#57534E]" />
                                      공개중
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3 h-3 text-[#9A3412]" />
                                      비공개
                                    </>
                                  )}
                                </span>
                              </div>

                              <h3 className="text-base font-semibold text-[#1C1917]">
                                {notice.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#57534E] line-clamp-2">
                                {notice.summary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditNotice(notice)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] hover:bg-[#EBE6DF] border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>수정</span>
                            </button>

                            {confirmDeleteNoticeId === notice.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDeleteNotice(notice.id)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md cursor-pointer whitespace-nowrap"
                                >
                                  삭제 확인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteNoticeId(null)}
                                  className="px-2 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteNoticeId(notice.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/10 border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>삭제</span>
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: HISTORY TIMELINE WORKSPACE */}
            {activeTab === 'history' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 5 Cols: History Create / Edit Form */}
                <form
                  onSubmit={handleSubmitHistory}
                  className="lg:col-span-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-xl p-6 space-y-4 lg:sticky lg:top-24"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <h2 className="font-editorial text-xl font-semibold text-[#1C1917]">
                      {editingHistoryId ? '연혁 항목 수정' : '새 연혁 추가'}
                    </h2>
                    {editingHistoryId && (
                      <button
                        type="button"
                        onClick={handleStartCreateHistory}
                        className="text-xs font-medium text-[#9A6B22] hover:underline cursor-pointer"
                      >
                        새 추가 모드로 전환
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label htmlFor="history-year" className="font-medium text-[#292524]">
                        연도 (4자리 숫자)
                      </label>
                      <div className="inline-flex items-center gap-1">
                        {PRESET_YEARS.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setHistoryForm({ ...historyForm, year: yr })}
                            className={`px-2 py-0.5 text-[11px] font-tabular rounded transition-colors cursor-pointer ${
                              historyForm.year === yr
                                ? 'bg-[#1C1917] text-[#FBF9F5]'
                                : 'bg-[#EBE6DF] text-[#57534E] hover:text-[#1C1917]'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      id="history-year"
                      type="text"
                      inputMode="numeric"
                      maxLength={HISTORY_CONSTRAINTS.YEAR_LENGTH}
                      value={historyForm.year}
                      onChange={(e) =>
                        setHistoryForm({
                          ...historyForm,
                          year: e.target.value.replace(/[^0-9]/g, ''),
                        })
                      }
                      placeholder="예: 2026"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] font-tabular focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="history-date" className="font-medium text-[#292524]">
                        날짜 또는 기간
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {historyForm.date.length}/{HISTORY_CONSTRAINTS.DATE_MAX}
                      </span>
                    </div>
                    <input
                      id="history-date"
                      type="text"
                      maxLength={HISTORY_CONSTRAINTS.DATE_MAX}
                      value={historyForm.date}
                      onChange={(e) => setHistoryForm({ ...historyForm, date: e.target.value })}
                      placeholder="예: 03.15 – 04.26 또는 05.12"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] font-tabular focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="history-title" className="font-medium text-[#292524]">
                        사역 내용 (제목)
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {historyForm.title.length}/{HISTORY_CONSTRAINTS.TITLE_MAX}
                      </span>
                    </div>
                    <input
                      id="history-title"
                      type="text"
                      maxLength={HISTORY_CONSTRAINTS.TITLE_MAX}
                      value={historyForm.title}
                      onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
                      placeholder="예: 제9기 기도 말씀 컨퍼런스"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="history-location" className="font-medium text-[#292524]">
                        장소 (선택 사항)
                      </label>
                      <span className="font-tabular text-[#78716C]">
                        {historyForm.location.length}/{HISTORY_CONSTRAINTS.LOCATION_MAX}
                      </span>
                    </div>
                    <input
                      id="history-location"
                      type="text"
                      maxLength={HISTORY_CONSTRAINTS.LOCATION_MAX}
                      value={historyForm.location}
                      onChange={(e) =>
                        setHistoryForm({ ...historyForm, location: e.target.value })
                      }
                      placeholder="예: 수원 빛과소금교회 PGI센터"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="history-author"
                      className="block text-xs font-medium text-[#292524] mb-1"
                    >
                      작성자 표기명
                    </label>
                    <input
                      id="history-author"
                      type="text"
                      maxLength={HISTORY_CONSTRAINTS.AUTHOR_NAME_MAX}
                      value={historyForm.authorName}
                      onChange={(e) =>
                        setHistoryForm({ ...historyForm, authorName: e.target.value })
                      }
                      placeholder="예: PGI 선교회 사무국"
                      className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                    />
                  </div>

                  <div className="pt-1 flex items-center gap-4 text-xs text-[#292524]">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={historyForm.isPublished}
                        onChange={(e) =>
                          setHistoryForm({ ...historyForm, isPublished: e.target.checked })
                        }
                        className="w-4 h-4 accent-[#1C1917] rounded"
                      />
                      <span>홈페이지 연혁에 즉시 공개</span>
                    </label>
                  </div>

                  {historyFormError && (
                    <p role="alert" className="text-xs font-medium text-[#9A3412]">
                      {historyFormError}
                    </p>
                  )}
                  {historyFormSuccess && (
                    <p role="status" className="text-xs font-medium text-[#9A6B22]">
                      {historyFormSuccess}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingHistory}
                      className="flex-1 py-2.5 px-5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingHistory
                        ? '저장 중...'
                        : editingHistoryId
                          ? '수정 사항 저장'
                          : '연혁 추가하기'}
                    </button>
                    {editingHistoryId && (
                      <button
                        type="button"
                        onClick={handleStartCreateHistory}
                        className="py-2.5 px-4 text-sm font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EBE6DF] rounded-md transition-colors cursor-pointer"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>

                {/* Right 7 Cols: Live Firestore History List */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-200">
                    <p className="text-sm font-medium text-[#1C1917] font-tabular">
                      데이터베이스 연혁 ({filteredHistories.length}건)
                    </p>

                    {historyYears.length > 0 && (
                      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg">
                        {['all', ...historyYears].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setHistoryYearFilter(yr)}
                            className={`px-3 py-1 text-xs font-medium font-tabular rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              effectiveHistoryYear === yr
                                ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                                : 'text-[#57534E] hover:text-[#1C1917]'
                            }`}
                          >
                            {yr === 'all' ? '전체' : `${yr}년`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!hasSeededHistories && (
                    <div className="p-4 bg-[#F3EFE6]/70 border border-stone-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#57534E]">
                      <p className="leading-relaxed">
                        새로 추가한 연혁은 기존 2022–2025년 기본 연혁과 함께 홈페이지에 자동
                        표시됩니다. 기존 연혁도 수정·삭제하려면 ‘기존 연혁 불러오기’를 눌러주세요.
                      </p>
                      <button
                        type="button"
                        disabled={isSeedingHistories}
                        onClick={handleSeedInitialHistories}
                        className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FBF9F5] border border-stone-300 hover:border-stone-400 rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
                      >
                        {isSeedingHistories ? '불러오는 중...' : '기존 연혁 불러오기'}
                      </button>
                    </div>
                  )}

                  {historyListLoading ? (
                    <p className="py-12 text-center text-sm text-[#78716C]">
                      연혁 목록을 불러오는 중입니다...
                    </p>
                  ) : groupedHistories.length === 0 ? (
                    <div className="p-8 bg-[#F3EFE6]/60 border border-stone-200 rounded-xl text-center space-y-3">
                      <p className="text-sm text-[#57534E]">
                        아직 데이터베이스에 직접 등록된 연혁 항목이 없습니다.
                      </p>
                      <p className="text-xs text-[#78716C]">
                        왼쪽 양식에서 새 연혁을 추가하면 홈페이지 ‘걸어온 길(연혁)’에 바로 반영됩니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedHistories.map((group) => (
                        <div
                          key={group.year}
                          className="border border-stone-200 rounded-xl bg-[#FBF9F5] overflow-hidden"
                        >
                          <div className="px-5 py-3 bg-[#F3EFE6]/70 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="font-editorial text-xl font-semibold text-[#1C1917] font-tabular">
                              {group.year}년
                            </h3>
                            <span className="text-xs text-[#78716C] font-tabular">
                              {group.items.length}건
                            </span>
                          </div>

                          <div className="divide-y divide-stone-200">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                                    <span className="font-tabular font-medium text-[#9A6B22]">
                                      {item.date}
                                    </span>
                                    {item.location && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span>{item.location}</span>
                                      </>
                                    )}
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1">
                                      {item.isPublished ? (
                                        <>
                                          <Eye className="w-3 h-3 text-[#57534E]" />
                                          공개중
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-3 h-3 text-[#9A3412]" />
                                          비공개
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm sm:text-base font-medium text-[#1C1917]">
                                    {item.title}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditHistory(item)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] hover:bg-[#EBE6DF] border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>수정</span>
                                  </button>

                                  {confirmDeleteHistoryId === item.id ? (
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmDeleteHistory(item.id)}
                                        className="px-2.5 py-1.5 text-xs font-medium text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md cursor-pointer whitespace-nowrap"
                                      >
                                        삭제 확인
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteHistoryId(null)}
                                        className="px-2 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer whitespace-nowrap"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteHistoryId(item.id)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/10 border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>삭제</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PARTICIPANTS MANAGEMENT WORKSPACE */}
            {activeTab === 'participants' && (
              <>
                {!isBootstrapped ? (
                  <div className="max-w-2xl p-8 bg-[#F3EFE6] border border-stone-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#9A3412]">
                      <Shield className="w-4 h-4" />
                      <span>개인정보 보호 정책</span>
                    </div>
                    <h2 className="font-editorial text-xl font-semibold text-[#1C1917]">
                      참가자 개인정보 열람 및 관리는 대표 관리자 계정 전용입니다
                    </h2>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      참가자의 사진, 전화번호, 약식주소, 텔레그램 아이디 등 개인정보 보호를 위해
                      참가자 관리 메뉴는 대표 관리자({BOOTSTRAPPED_ADMIN_EMAIL}) 계정에서만
                      열람 및 수정할 수 있습니다.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left 5 Cols: Participant Create / Edit Form */}
                    <form
                      onSubmit={handleSubmitParticipant}
                      className="lg:col-span-5 bg-[#F3EFE6]/70 border border-stone-200 rounded-xl p-6 space-y-4 lg:sticky lg:top-24"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <h2 className="font-editorial text-xl font-semibold text-[#1C1917]">
                          {editingParticipantId ? '참가자 정보 수정' : '새 참가자 등록'}
                        </h2>
                        {editingParticipantId && (
                          <button
                            type="button"
                            onClick={handleStartCreateParticipant}
                            className="text-xs font-medium text-[#9A6B22] hover:underline cursor-pointer"
                          >
                            새 등록으로 전환
                          </button>
                        )}
                      </div>

                      {/* Photo Upload or URL */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[#292524] inline-flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#9A6B22]" />
                            <span>사진 (선택)</span>
                          </span>

                          <div className="inline-flex items-center gap-1 p-0.5 bg-[#EBE6DF] rounded-md">
                            <button
                              type="button"
                              onClick={() => setParticipantPhotoMode('upload')}
                              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                                participantPhotoMode === 'upload'
                                  ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                                  : 'text-[#57534E] hover:text-[#1C1917]'
                              }`}
                            >
                              파일 업로드
                            </button>
                            <button
                              type="button"
                              onClick={() => setParticipantPhotoMode('url')}
                              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                                participantPhotoMode === 'url'
                                  ? 'bg-[#FBF9F5] text-[#1C1917] shadow-sm'
                                  : 'text-[#57534E] hover:text-[#1C1917]'
                              }`}
                            >
                              이미지 URL
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-16 h-16 rounded-lg border border-stone-300 bg-[#EBE6DF] overflow-hidden shrink-0 flex items-center justify-center">
                            {participantForm.photoUrl ? (
                              <img
                                src={participantForm.photoUrl}
                                alt="참가자 사진 미리보기"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-6 h-6 text-[#78716C]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            {participantPhotoMode === 'upload' ? (
                              <label className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-dashed border-stone-300 hover:border-[#9A6B22] rounded-md text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors cursor-pointer">
                                <Upload className="w-3.5 h-3.5 text-[#9A6B22]" />
                                <span className="truncate">
                                  {isProcessingParticipantPhoto
                                    ? '사진 최적화 중...'
                                    : participantForm.photoUrl
                                      ? '다른 사진으로 변경'
                                      : '사진 파일 선택 (JPG · PNG)'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  onChange={handleParticipantPhotoFileChange}
                                  disabled={isProcessingParticipantPhoto}
                                  className="sr-only"
                                />
                              </label>
                            ) : (
                              <input
                                id="participant-photo-url"
                                type="url"
                                maxLength={PARTICIPANT_CONSTRAINTS.PHOTO_URL_MAX}
                                value={
                                  participantForm.photoUrl.startsWith('data:')
                                    ? ''
                                    : participantForm.photoUrl
                                }
                                onChange={(e) => {
                                  setParticipantForm({
                                    ...participantForm,
                                    photoUrl: e.target.value,
                                  });
                                  setParticipantPhotoMetaNote('');
                                }}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                              />
                            )}

                            {participantForm.photoUrl && (
                              <div className="flex items-center justify-between gap-2 text-[11px] text-[#78716C]">
                                <span className="truncate font-tabular">
                                  {participantPhotoMetaNote || '사진 URL 입력됨'}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleRemoveParticipantPhoto}
                                  className="inline-flex items-center gap-1 text-[#9A3412] hover:underline font-medium cursor-pointer shrink-0 whitespace-nowrap"
                                >
                                  <X className="w-3 h-3" />
                                  <span>사진 제거</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <label htmlFor="participant-name" className="font-medium text-[#292524]">
                              이름
                            </label>
                            <span className="font-tabular text-[#78716C]">
                              {participantForm.name.length}/{PARTICIPANT_CONSTRAINTS.NAME_MAX}
                            </span>
                          </div>
                          <input
                            id="participant-name"
                            type="text"
                            maxLength={PARTICIPANT_CONSTRAINTS.NAME_MAX}
                            value={participantForm.name}
                            onChange={(e) =>
                              setParticipantForm({ ...participantForm, name: e.target.value })
                            }
                            placeholder="예: 홍길동"
                            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <label
                              htmlFor="participant-cohort"
                              className="font-medium text-[#292524]"
                            >
                              참여기수
                            </label>
                            <span className="font-tabular text-[#78716C]">
                              {participantForm.cohort.length}/{PARTICIPANT_CONSTRAINTS.COHORT_MAX}
                            </span>
                          </div>
                          <input
                            id="participant-cohort"
                            type="text"
                            maxLength={PARTICIPANT_CONSTRAINTS.COHORT_MAX}
                            value={participantForm.cohort}
                            onChange={(e) =>
                              setParticipantForm({ ...participantForm, cohort: e.target.value })
                            }
                            placeholder="예: 9기 또는 제자스쿨 3기"
                            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                          />
                        </div>
                      </div>

                      {participantCohorts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-[#78716C] mr-1">기존 기수 선택:</span>
                          {participantCohorts.slice(0, 6).map((cohortOption) => (
                            <button
                              key={cohortOption}
                              type="button"
                              onClick={() =>
                                setParticipantForm({ ...participantForm, cohort: cohortOption })
                              }
                              className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer whitespace-nowrap ${
                                participantForm.cohort === cohortOption
                                  ? 'bg-[#1C1917] text-[#FBF9F5]'
                                  : 'bg-[#EBE6DF] text-[#57534E] hover:text-[#1C1917]'
                              }`}
                            >
                              {cohortOption}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="participant-telegram"
                            className="block text-xs font-medium text-[#292524] mb-1"
                          >
                            텔레아이디
                          </label>
                          <input
                            id="participant-telegram"
                            type="text"
                            maxLength={PARTICIPANT_CONSTRAINTS.TELEGRAM_MAX}
                            value={participantForm.telegramId}
                            onChange={(e) =>
                              setParticipantForm({
                                ...participantForm,
                                telegramId: e.target.value,
                              })
                            }
                            placeholder="예: @pgi_member"
                            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="participant-phone"
                            className="block text-xs font-medium text-[#292524] mb-1"
                          >
                            전화번호
                          </label>
                          <input
                            id="participant-phone"
                            type="tel"
                            maxLength={PARTICIPANT_CONSTRAINTS.PHONE_MAX}
                            value={participantForm.phone}
                            onChange={(e) =>
                              setParticipantForm({ ...participantForm, phone: e.target.value })
                            }
                            placeholder="예: 010-1234-5678"
                            className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] font-tabular focus:outline-none focus:border-[#9A6B22]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label
                            htmlFor="participant-address"
                            className="font-medium text-[#292524]"
                          >
                            약식주소
                          </label>
                          <span className="font-tabular text-[#78716C]">
                            {participantForm.shortAddress.length}/
                            {PARTICIPANT_CONSTRAINTS.SHORT_ADDRESS_MAX}
                          </span>
                        </div>
                        <input
                          id="participant-address"
                          type="text"
                          maxLength={PARTICIPANT_CONSTRAINTS.SHORT_ADDRESS_MAX}
                          value={participantForm.shortAddress}
                          onChange={(e) =>
                            setParticipantForm({
                              ...participantForm,
                              shortAddress: e.target.value,
                            })
                          }
                          placeholder="예: 경기도 수원시 권선구"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                        />
                      </div>

                      {participantFormError && (
                        <p role="alert" className="text-xs font-medium text-[#9A3412]">
                          {participantFormError}
                        </p>
                      )}
                      {participantFormSuccess && (
                        <p role="status" className="text-xs font-medium text-[#9A6B22]">
                          {participantFormSuccess}
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSavingParticipant || isProcessingParticipantPhoto}
                          className="flex-1 py-2.5 px-5 text-sm font-medium text-[#FBF9F5] bg-[#1C1917] hover:bg-[#342F2B] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingParticipant
                            ? '저장 중...'
                            : editingParticipantId
                              ? '수정 사항 저장'
                              : '참가자 등록하기'}
                        </button>
                        {editingParticipantId && (
                          <button
                            type="button"
                            onClick={handleStartCreateParticipant}
                            className="py-2.5 px-4 text-sm font-medium text-[#57534E] hover:text-[#1C1917] bg-[#EBE6DF] rounded-md transition-colors cursor-pointer"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Right 7 Cols: Live Firestore Participant Roster */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
                        <p className="text-sm font-medium text-[#1C1917] font-tabular">
                          등록된 참가자 ({filteredParticipants.length}명)
                        </p>

                        {participantCohorts.length > 0 && (
                          <select
                            aria-label="참여기수 필터"
                            value={effectiveParticipantCohort}
                            onChange={(e) => setParticipantCohortFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#F3EFE6] border border-stone-300 rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                          >
                            <option value="all">전체 기수 ({participants.length}명)</option>
                            {participantCohorts.map((cohort) => (
                              <option key={cohort} value={cohort}>
                                {cohort}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          placeholder="이름, 참여기수, 텔레아이디, 전화번호, 약식주소 검색"
                          className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg text-[#1C1917] focus:outline-none focus:border-[#9A6B22]"
                        />
                        {participantSearch && (
                          <button
                            type="button"
                            onClick={() => setParticipantSearch('')}
                            aria-label="검색어 지우기"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {participantListLoading ? (
                        <p className="py-12 text-center text-sm text-[#78716C]">
                          참가자 명단을 불러오는 중입니다...
                        </p>
                      ) : filteredParticipants.length === 0 ? (
                        <div className="p-8 bg-[#F3EFE6]/60 border border-stone-200 rounded-xl text-center space-y-2">
                          <p className="text-sm text-[#57534E]">
                            {participants.length === 0
                              ? '아직 등록된 참가자가 없습니다.'
                              : '검색 조건에 해당하는 참가자가 없습니다.'}
                          </p>
                          <p className="text-xs text-[#78716C]">
                            {participants.length === 0
                              ? '왼쪽 양식에서 사진, 이름, 텔레아이디, 참여기수, 전화번호, 약식주소를 입력해 등록해 주세요.'
                              : '검색어나 기수 필터를 변경해 보세요.'}
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl bg-[#FBF9F5]">
                          {filteredParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-start gap-4 min-w-0 flex-1">
                                <div className="w-14 h-14 rounded-lg border border-stone-200 bg-[#EBE6DF] overflow-hidden shrink-0 flex items-center justify-center">
                                  {participant.photoUrl ? (
                                    <img
                                      src={participant.photoUrl}
                                      alt={`${participant.name} 사진`}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="font-editorial text-lg font-semibold text-[#57534E]">
                                      {participant.name.slice(0, 1) || '?'}
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <h3 className="text-base font-semibold text-[#1C1917]">
                                      {participant.name}
                                    </h3>
                                    <span aria-hidden="true" className="text-[#78716C] text-xs">
                                      ·
                                    </span>
                                    <span className="text-xs font-medium text-[#9A6B22]">
                                      {participant.cohort}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#57534E]">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Send className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                                      <span>{participant.telegramId || '텔레아이디 미등록'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-tabular">
                                      <Phone className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                                      <span>{participant.phone || '전화번호 미등록'}</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">
                                      {participant.shortAddress || '약식주소 미등록'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditParticipant(participant)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#F3EFE6] hover:bg-[#EBE6DF] border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>수정</span>
                                </button>

                                {confirmDeleteParticipantId === participant.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConfirmDeleteParticipant(participant.id)
                                      }
                                      className="px-2.5 py-1.5 text-xs font-medium text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md cursor-pointer whitespace-nowrap"
                                    >
                                      삭제 확인
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteParticipantId(null)}
                                      className="px-2 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer whitespace-nowrap"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteParticipantId(participant.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/10 border border-stone-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>삭제</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
