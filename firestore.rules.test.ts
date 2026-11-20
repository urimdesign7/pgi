// Reference security rule assertions for the 12 Dirty Dozen attack payloads
// documented in security_spec.md against firestore.rules (notices, histories, participants, inquiries, admins).

export const DIRTY_DOZEN_CASES = [
  { name: 'Unauthenticated participant/notice/history/inquiry read access', expected: 'PERMISSION_DENIED' },
  { name: 'Non-admin verified user PII read/write on /participants or /inquiries', expected: 'PERMISSION_DENIED' },
  { name: 'Unverified admin email spoof on /participants or /inquiries', expected: 'PERMISSION_DENIED' },
  { name: 'Author UID spoofing on create', expected: 'PERMISSION_DENIED' },
  { name: 'Shadow field injection or inquiry status spoofing on create', expected: 'PERMISSION_DENIED' },
  { name: 'Unsafe photoUrl/imageUrl scheme (javascript:/svg+xml)', expected: 'PERMISSION_DENIED' },
  { name: 'Oversized photoUrl/imageUrl (>400000), imageUrls (>10), inquiry message (>2000), or content (>5000)', expected: 'PERMISSION_DENIED' },
  { name: 'Invalid document ID characters or length (>128)', expected: 'PERMISSION_DENIED' },
  { name: 'Forged createdAt timestamp', expected: 'PERMISSION_DENIED' },
  { name: 'Immutable authorId/createdAt/inquiry sender field mutation on update', expected: 'PERMISSION_DENIED' },
  { name: 'Unauthorized list query on /inquiries, /participants, or unpublished drafts', expected: 'PERMISSION_DENIED' },
  { name: 'Self-privilege escalation on /admins/{uid}', expected: 'PERMISSION_DENIED' },
] as const;
