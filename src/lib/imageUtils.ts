export interface CompressedImageResult {
  dataUrl: string;
  approxKb: number;
  width: number;
  height: number;
}

const MAX_RAW_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_DATA_URL_CHARS = 360_000; // ~270KB decoded, safely below Firestore 1MB doc limit

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 파일을 읽을 수 없습니다. 다른 이미지를 선택해 주세요.'));
    img.src = src;
  });
}

function estimateBase64Kb(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  const base64Len = commaIdx >= 0 ? dataUrl.length - commaIdx - 1 : dataUrl.length;
  return Math.max(1, Math.round((base64Len * 3) / 4 / 1024));
}

interface CompressImageOptions {
  dimensionCaps?: number[];
  maxDataUrlChars?: number;
  qualities?: number[];
}

async function compressImageFile(
  file: File,
  options?: CompressImageOptions
): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일(JPG, PNG, WEBP, GIF)만 첨부할 수 있습니다.');
  }
  if (file.type === 'image/svg+xml') {
    throw new Error('SVG 파일은 보안상 업로드할 수 없습니다. JPG 또는 PNG 이미지를 사용해 주세요.');
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('원본 파일 크기가 20MB를 초과합니다. 더 작은 이미지를 선택해 주세요.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;

    if (!naturalW || !naturalH) {
      throw new Error('유효한 이미지 크기를 확인할 수 없습니다.');
    }

    const dimensionCaps = options?.dimensionCaps ?? [1200, 960, 760];
    const maxDataUrlChars = options?.maxDataUrlChars ?? MAX_DATA_URL_CHARS;
    const qualities = options?.qualities ?? [0.82, 0.72, 0.62, 0.5];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('브라우저 이미지 처리 기능을 사용할 수 없습니다.');
    }

    for (const maxDim of dimensionCaps) {
      const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      for (const quality of qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= maxDataUrlChars) {
          return {
            dataUrl,
            approxKb: estimateBase64Kb(dataUrl),
            width: targetW,
            height: targetH,
          };
        }
      }
    }

    throw new Error('이미지 용량이 너무 큽니다. 해상도가 조금 더 낮은 이미지를 선택해 주세요.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function compressNoticeImageFile(file: File): Promise<CompressedImageResult> {
  return compressImageFile(file, {
    dimensionCaps: [1200, 960, 760],
    maxDataUrlChars: MAX_DATA_URL_CHARS,
  });
}

export function compressGalleryImageFile(file: File): Promise<CompressedImageResult> {
  return compressImageFile(file, {
    dimensionCaps: [960, 760, 640, 480],
    maxDataUrlChars: 72_000,
    qualities: [0.8, 0.7, 0.6, 0.5, 0.42],
  });
}

export function compressParticipantPhotoFile(file: File): Promise<CompressedImageResult> {
  return compressImageFile(file, {
    dimensionCaps: [720, 560, 420],
    maxDataUrlChars: 300_000,
  });
}
