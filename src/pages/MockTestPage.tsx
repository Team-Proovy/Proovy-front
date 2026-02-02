/**
 * Mock 데이터 타입 검증 테스트 페이지
 * 모든 API hook들을 호출해서 타입이 제대로 작동하는지 확인
 */
import {
  useMyProfile,
  useMySubscription,
} from "@/features/settings/hooks/useUser";
import { useNoteList, useCreateNote } from "@/features/notes/hooks/useNotes";
import {
  useAssetDetail,
  useDownloadUrl,
} from "@/features/storage/hooks/useAssets";

const MockTestPage = () => {
  // ============================================================
  // User API Tests
  // ============================================================
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useMyProfile();
  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useMySubscription();

  // ============================================================
  // Notes API Tests
  // ============================================================
  const {
    data: noteList,
    isLoading: notesLoading,
    error: notesError,
  } = useNoteList({
    page: 0,
    size: 10,
    sort: "lastUsedAt,desc",
  });
  const createNoteMutation = useCreateNote();

  // 노트 생성 테스트
  const handleCreateNote = () => {
    createNoteMutation.mutate({
      firstMessage: "테스트 노트입니다",
      mentionedAssetIds: [],
      mentionedToolCodes: [],
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold">🧪 Mock 데이터 타입 테스트</h1>

      {/* Profile Test */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          👤 내 프로필 (useMyProfile)
        </h2>
        {profileLoading && <p className="text-gray-500">로딩 중...</p>}
        {profileError && (
          <p className="text-red-500">에러: {String(profileError)}</p>
        )}
        {profile && (
          <div className="space-y-2 text-sm">
            <p>
              <strong>userId:</strong> {profile.userId}
            </p>
            <p>
              <strong>email:</strong> {profile.email}
            </p>
            <p>
              <strong>name:</strong> {profile.name}
            </p>
            <p>
              <strong>nickname:</strong> {profile.nickname}
            </p>
            <p>
              <strong>department:</strong> {profile.department}
            </p>
            <p>
              <strong>provider:</strong> {profile.provider}
            </p>
            <p>
              <strong>createdAt:</strong> {profile.createdAt}
            </p>

            <div className="mt-4 rounded bg-gray-50 p-3">
              <p className="font-semibold">📦 구독 정보</p>
              <p>plan: {profile.subscription.plan}</p>
              <p>startDate: {profile.subscription.startDate}</p>
              <p>endDate: {profile.subscription.endDate}</p>
            </div>

            <div className="mt-4 rounded bg-blue-50 p-3">
              <p className="font-semibold">💳 크레딧 정보</p>
              <p>
                일일 크레딧: {profile.credit.dailyCredit.balance}/
                {profile.credit.dailyCredit.limit}
              </p>
              <p>
                월간 크레딧: {profile.credit.monthlyCredit.balance}/
                {profile.credit.monthlyCredit.limit}
              </p>
              <p>총 사용 가능: {profile.credit.totalAvailable}</p>
            </div>

            <div className="mt-4 rounded bg-green-50 p-3">
              <p className="font-semibold">💾 스토리지 정보</p>
              <p>
                사용량: {profile.storage.used} / {profile.storage.limit}{" "}
                {profile.storage.unit}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Subscription Test */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          💎 구독 상세 (useMySubscription)
        </h2>
        {subLoading && <p className="text-gray-500">로딩 중...</p>}
        {subError && <p className="text-red-500">에러: {String(subError)}</p>}
        {subscription && (
          <div className="space-y-2 text-sm">
            <div className="rounded bg-gray-50 p-3">
              <p className="font-semibold">📋 현재 플랜</p>
              <p>name: {subscription.currentPlan.name}</p>
              <p>displayName: {subscription.currentPlan.displayName}</p>
              <p>
                price: {subscription.currentPlan.price}{" "}
                {subscription.currentPlan.currency}
              </p>
              <p>billingCycle: {subscription.currentPlan.billingCycle}</p>
            </div>

            <div className="rounded bg-blue-50 p-3">
              <p className="font-semibold">📅 구독 기간</p>
              <p>startDate: {subscription.period.startDate}</p>
              <p>endDate: {subscription.period.endDate}</p>
              <p>daysRemaining: {subscription.period.daysRemaining}일</p>
            </div>

            <div className="rounded bg-green-50 p-3">
              <p className="font-semibold">🎁 혜택</p>
              <p>dailyCredit: {subscription.benefits.dailyCredit}</p>
              <p>monthlyCredit: {subscription.benefits.monthlyCredit}</p>
              <p>storageLimit: {subscription.benefits.storageLimit}</p>
              <p>maxNotes: {subscription.benefits.maxNotes}</p>
            </div>

            <div className="rounded bg-yellow-50 p-3">
              <p className="font-semibold">📦 사용 가능한 플랜들</p>
              {subscription.availablePlans.map((plan) => (
                <div
                  key={plan.name}
                  className="mt-2 rounded border bg-white p-2"
                >
                  <p>
                    <strong>{plan.displayName}</strong> -{" "}
                    {plan.price.toLocaleString()}원/{plan.billingCycle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Notes Test */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          📝 노트 목록 (useNoteList)
        </h2>
        {notesLoading && <p className="text-gray-500">로딩 중...</p>}
        {notesError && (
          <p className="text-red-500">에러: {String(notesError)}</p>
        )}
        {noteList && (
          <div className="space-y-2 text-sm">
            <div className="rounded bg-gray-50 p-3">
              <p className="font-semibold">📊 페이지 정보</p>
              <p>page: {noteList.pageInfo.page}</p>
              <p>size: {noteList.pageInfo.size}</p>
              <p>totalElements: {noteList.pageInfo.totalElements}</p>
              <p>totalPages: {noteList.pageInfo.totalPages}</p>
              <p>hasNext: {String(noteList.pageInfo.hasNext)}</p>
              <p>hasPrevious: {String(noteList.pageInfo.hasPrevious)}</p>
            </div>

            <div className="mt-4">
              <p className="mb-2 font-semibold">
                📚 노트 목록 ({noteList.notes.length}개)
              </p>
              {noteList.notes.map((note) => (
                <div
                  key={note.noteId}
                  className="mb-2 rounded border bg-white p-3"
                >
                  <p>
                    <strong>#{note.noteId}</strong> {note.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    대화: {note.conversationCount}/{note.conversationLimit} (
                    {note.conversationUsagePercent}%) | 파일: {note.assetCount}
                    개
                  </p>
                  <p className="text-xs text-gray-400">
                    생성: {note.createdAt} | 최근 사용: {note.lastUsedAt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Create Note Test */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          ✨ 노트 생성 (useCreateNote)
        </h2>
        <button
          onClick={handleCreateNote}
          disabled={createNoteMutation.isPending}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {createNoteMutation.isPending ? "생성 중..." : "테스트 노트 생성"}
        </button>
        {createNoteMutation.isSuccess && (
          <div className="mt-4 rounded bg-green-50 p-3 text-sm">
            <p className="font-semibold text-green-700">✅ 생성 성공!</p>
            <p>noteId: {createNoteMutation.data?.result.noteId}</p>
            <p>title: {createNoteMutation.data?.result.title}</p>
          </div>
        )}
        {createNoteMutation.isError && (
          <p className="mt-4 text-red-500">
            에러: {String(createNoteMutation.error)}
          </p>
        )}
      </section>

      {/* Assets Test */}
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          📁 에셋 테스트 (useAssetDetail)
        </h2>
        <AssetTestSection />
      </section>

      {/* Type Check Summary */}
      <section className="rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 text-xl font-semibold">📋 타입 체크 요약</h2>
        <ul className="space-y-1 text-sm">
          <li>✅ MyProfileResponse 타입 매칭</li>
          <li>✅ SubscriptionResponse 타입 매칭</li>
          <li>✅ NoteListResponse 타입 매칭</li>
          <li>✅ CreateNoteResponse 타입 매칭</li>
          <li>✅ AssetDetailResponse 타입 매칭</li>
          <li>✅ DownloadUrlResponse 타입 매칭</li>
        </ul>
        <p className="mt-4 text-xs text-gray-600">
          이 페이지가 TypeScript 에러 없이 표시되면 모든 타입이 정상적으로
          매칭된 것입니다.
        </p>
      </section>
    </div>
  );
};

// 에셋 테스트용 별도 컴포넌트 (조건부 렌더링을 위해)
const AssetTestSection = () => {
  const testAssetId = 1; // 테스트용 ID
  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useAssetDetail(testAssetId);
  const { data: downloadUrl, isLoading: downloadLoading } = useDownloadUrl(
    testAssetId,
    false,
  );

  return (
    <div className="space-y-4 text-sm">
      {assetLoading && <p className="text-gray-500">로딩 중...</p>}
      {assetError && <p className="text-red-500">에러: {String(assetError)}</p>}
      {asset && (
        <div className="space-y-2">
          <p>
            <strong>assetId:</strong> {asset.assetId}
          </p>
          <p>
            <strong>noteId:</strong> {asset.noteId}
          </p>
          <p>
            <strong>fileName:</strong> {asset.fileName}
          </p>
          <p>
            <strong>fileSize:</strong> {(asset.fileSize / 1024).toFixed(2)} KB
          </p>
          <p>
            <strong>mimeType:</strong> {asset.mimeType}
          </p>
          <p>
            <strong>source:</strong> {asset.source}
          </p>
          <p>
            <strong>ocrStatus:</strong> {asset.ocrStatus}
          </p>
          <p>
            <strong>totalPages:</strong> {asset.totalPages ?? "N/A"}
          </p>
          <p>
            <strong>createdAt:</strong> {asset.createdAt}
          </p>

          {asset.ocrText && (
            <div className="mt-4 rounded bg-yellow-50 p-3">
              <p className="font-semibold">📄 OCR 결과</p>
              <p className="text-xs text-gray-600">
                모델: {asset.ocrText.model}
              </p>
              <p className="mt-2 truncate text-xs">
                전체 텍스트: {asset.ocrText.fullText.substring(0, 100)}...
              </p>
            </div>
          )}
        </div>
      )}

      {downloadLoading && (
        <p className="text-gray-500">다운로드 URL 로딩 중...</p>
      )}
      {downloadUrl && (
        <div className="rounded bg-blue-50 p-3">
          <p className="font-semibold">📥 다운로드 URL</p>
          <p>
            <strong>assetId:</strong> {downloadUrl.assetId}
          </p>
          <p>
            <strong>fileName:</strong> {downloadUrl.fileName}
          </p>
          <p className="truncate text-xs">
            <strong>URL:</strong> {downloadUrl.downloadUrl}
          </p>
          <p>
            <strong>expiresAt:</strong> {downloadUrl.expiresAt}
          </p>
        </div>
      )}
    </div>
  );
};

export default MockTestPage;
