# proovy-brain 계약 fixture 사본 (검증된 mirror)

이 디렉터리는 **두 번째 SSOT가 아니다.** 브라우저 run API wire 계약(browser-run-v1)의 schema·정상/거부 예제 원본은
proovy-brain `tests/fixtures/contracts/`이고, 여기에는 `PIN.json`의 commit에서 복사한 파일만 둔다.
Proovy-server `src/test/resources/contracts/brain/PIN.json`과 같은 commit·`consumer_version`·manifest sha256을 pin한다.

| 경로 | 원본 |
|---|---|
| `browser-run-v1/**` | `tests/fixtures/contracts/browser-run-v1/**` (manifest·CATALOG·builder 포함 전체) |
| `terminal-v2/browser.schema.json` | `tests/fixtures/contracts/terminal-v2/browser.schema.json` (schema `$ref` 의존) |

- `src/test/contracts/contract_mirror.test.ts`가 다음을 검사한다.
  - `PIN.json`의 `manifest_sha256`·`consumer_version`이 사본 manifest와 같다.
  - manifest `files`·`dependencies`의 모든 sha256이 사본과 같다.
  - 목록 밖 파일이 없다(`PIN.json`·`README.md` 제외).
  - `consumer_version`이 `src/shared/contracts/browser_run_v1.ts`의 `BROWSER_RUN_CONSUMER_VERSION`과 같다.
  - `PROOVY_SERVER_DIR`가 설정되어 있으면 Server `PIN.json`과 commit·version·manifest sha256이 같다(로컬 전용, CI에서는 건너뛴다).
- **손으로 고치지 않는다.** prettier·lint-staged 대상에서도 빠져 있다(`.prettierignore`).
- 계약 의미(경로·판정·오류)는 Server가 소유한다. Front가 계약과 다르게 읽어야 하면 사본이 아니라
  Server 이슈 → Brain 새 `consumer_version` → Server pin 갱신 → Front pin 갱신 순서로 바꾼다.

## 갱신 절차

1. Server `PIN.json`이 가리키는 proovy-brain commit SHA를 확인한다(Front는 Server와 같은 commit을 pin한다).
2. 이 디렉터리의 사본을 지우고 그 commit에서 다시 복사한다.

   ```bash
   SHA=<Server PIN.json의 commit>
   DEST=src/test/contracts/brain
   rm -rf "$DEST/browser-run-v1" "$DEST/terminal-v2"
   git -C <proovy-brain checkout> fetch origin dev
   git -C <proovy-brain checkout> archive "$SHA" \
     tests/fixtures/contracts/browser-run-v1 \
     tests/fixtures/contracts/terminal-v2/browser.schema.json \
     | tar -x --strip-components=3 -C "$DEST"
   ```

3. `PIN.json`의 `commit`, `consumer_version`(manifest 값), `manifest_sha256`(`sha256sum $DEST/browser-run-v1/manifest.json`)을 갱신한다.
   Server `PIN.json`과 값이 같아야 한다.
4. `consumer_version`이 바뀌었으면 `src/shared/contracts/browser_run_v1.ts`의 `BROWSER_RUN_CONSUMER_VERSION`과
   바뀐 타입을 함께 고친다. 고치지 않으면 `contract_mirror.test.ts`·`browser_run_types.test.ts`가 실패한다.
5. `PROOVY_SERVER_DIR=<Proovy-server checkout> pnpm test -- src/test/contracts`로 확인한다.
