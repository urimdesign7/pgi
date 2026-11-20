# Security Specification — PGI 선교회 관리자 (공지사항 · 연혁 · 참가자 · 문의 관리)

## 1. Data Invariants
1. **Default Deny Catch-All**: All paths not explicitly matched (`/{document=**}`) deny read and write.
2. **Admin-Only Mutations & Strict PII Isolation**: Only verified administrators (`email_verified == true`) can mutate `notices` and `histories`. `participants` and `inquiries` (containing PII: `name`, `phone`, `contact`, `shortAddress`, `telegramId`, `photoUrl`, `message`) are strictly isolated to `isBootstrappedAdmin()` for read/list/update/delete. Public visitors may only `create` an `inquiries` document with `status == '대기중'` and `adminNote == ''`.
3. **Draft Isolation**: Both `notices` and `histories` with `isPublished == false` are readable only by administrators; public list queries are enforced at the rule level via `resource.data.isPublished == true`.
4. **Immutable Provenance & Strict Server Timestamps**: `authorId` must equal `request.auth.uid` on creation and cannot be changed on update; `inquiries` sender fields (`name`, `contact`, `topic`, `message`) cannot be mutated on update; `createdAt` and `updatedAt` must equal `request.time`.
5. **Strict Key Allowlisting, Image Scheme Guard & Size Bounds**: Unknown shadow fields, unsafe URI schemes (`javascript:`, `image/svg+xml`), and oversized payloads (`notices.content > 5000`, `notices.imageUrls.size() > 10`, `inquiries.message > 2000`, `inquiries.adminNote > 1000`, `imageUrl`/`photoUrl > 400000`, `participants.name > 60`, `participants.cohort > 40`, `participants.phone > 30`, `participants.shortAddress > 120`, or document ID > 128 chars) are rejected.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Read / Participant Create**: Read/List `/inquiries` or `/participants/p1`, or create `/notices/n1` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Non-Admin Verified User Read/Write PII**: Authenticated non-admin user tries to read or update `/participants/p1` or `/inquiries/i1` -> `PERMISSION_DENIED`.
3. **Unverified Admin Email Spoof**: User with `email == 'urimdesign7@gmail.com'` and `email_verified == false` tries to read/write `/participants/p1` or `/inquiries/i1` -> `PERMISSION_DENIED`.
4. **Author UID Spoofing**: Admin creates `/participants/p1` or `/notices/n1` with `authorId: 'someone_else'` -> `PERMISSION_DENIED`.
5. **Shadow Field / Initial Status Spoof**: Public visitor creates `/inquiries/i1` with `status: '답변완료'` or non-empty `adminNote`, or extra field `role: 'vip'` -> `PERMISSION_DENIED`.
6. **Unsafe Image Scheme**: Admin creates `/participants/p1` with `photoUrl: 'javascript:alert(1)'` or `data:image/svg+xml;...` -> `PERMISSION_DENIED`.
7. **Oversized PII / Image DoW**: Payload with `photoUrl > 400000`, `shortAddress > 120`, or `inquiries.message > 2000` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: Create `/participants/invalid$id!`, `/inquiries/invalid$id!`, or ID > 128 chars -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Create `/inquiries/i1` or `/participants/p1` with `createdAt != request.time` -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: Update `/participants/p1` changing `createdAt`/`authorId`, or update `/inquiries/i1` modifying `contact`/`message` -> `PERMISSION_DENIED`.
11. **Public PII/Draft Scrape**: Unauthenticated or non-bootstrapped user lists `/inquiries`, `/participants`, or unfiltered `/notices` -> `PERMISSION_DENIED`.
12. **Self-Privilege Escalation**: Non-admin authenticated user creates `/admins/{ownUid}` -> `PERMISSION_DENIED`.
