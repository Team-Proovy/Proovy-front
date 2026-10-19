import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * browser-run-v1 검증된 사본 위치와 pin 검사.
 * 사본은 `brain/`에 있고, 갱신 절차는 `brain/README.md`에 있다.
 */
export const CONTRACT_MIRROR_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "brain",
);

/** 사본이 아닌 Front 소유 파일 */
export const MIRROR_OWN_FILES = ["PIN.json", "README.md"] as const;

export interface ContractPin {
  repository: string;
  commit: string;
  source_path: string;
  consumer_version: string;
  manifest: string;
  manifest_sha256: string;
}

interface ContractManifest {
  consumer_version: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
}

/** 사본 디렉터리 기준 상대 경로(`/` 구분) → 파일 바이트 */
export type MirrorFileMap = Map<string, Uint8Array>;

export const sha256Hex = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

export const readMirrorFiles = (rootDir: string = CONTRACT_MIRROR_DIR) => {
  const files: MirrorFileMap = new Map();
  const relativePaths = readdirSync(rootDir, {
    recursive: true,
    encoding: "utf8",
  });
  for (const relativePath of relativePaths) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!statSync(absolutePath).isFile()) continue;
    files.set(
      relativePath.split(path.sep).join("/"),
      readFileSync(absolutePath),
    );
  }
  return files;
};

export const readContractPin = (rootDir: string = CONTRACT_MIRROR_DIR) =>
  JSON.parse(
    readFileSync(path.join(rootDir, "PIN.json"), "utf8"),
  ) as ContractPin;

/**
 * pin과 사본이 맞는지 검사하고 위반 목록을 돌려준다(빈 배열이면 통과).
 * Server `BrainContractMirrorTest`와 같은 규칙이다.
 */
export const verifyContractMirror = (
  pin: ContractPin,
  files: MirrorFileMap,
  expectedConsumerVersion: string,
) => {
  const problems: string[] = [];

  if (!/^[0-9a-f]{40}$/.test(pin.commit)) {
    problems.push(
      `PIN.json commit은 40자리 소문자 SHA여야 한다: ${pin.commit}`,
    );
  }
  if (pin.consumer_version !== expectedConsumerVersion) {
    problems.push(
      `PIN.json consumer_version ${pin.consumer_version} ≠ 코드 기대값 ${expectedConsumerVersion}`,
    );
  }

  const manifestBytes = files.get(pin.manifest);
  if (!manifestBytes) {
    problems.push(`manifest 없음: ${pin.manifest}`);
    return problems;
  }
  const manifestSha = sha256Hex(manifestBytes);
  if (manifestSha !== pin.manifest_sha256) {
    problems.push(
      `manifest sha256 ${manifestSha} ≠ PIN.json manifest_sha256 ${pin.manifest_sha256}`,
    );
  }

  const manifest = JSON.parse(
    new TextDecoder().decode(manifestBytes),
  ) as ContractManifest;
  if (manifest.consumer_version !== pin.consumer_version) {
    problems.push(
      `manifest consumer_version ${manifest.consumer_version} ≠ PIN.json ${pin.consumer_version}`,
    );
  }

  const expectedDigests = { ...manifest.files, ...manifest.dependencies };
  for (const [filePath, expectedSha] of Object.entries(expectedDigests)) {
    const bytes = files.get(filePath);
    if (!bytes) {
      problems.push(`사본에 파일 없음: ${filePath}`);
      continue;
    }
    const actualSha = sha256Hex(bytes);
    if (actualSha !== expectedSha) {
      problems.push(`sha256 불일치(사본 변조): ${filePath}`);
    }
  }

  // manifest.json 자신은 files 목록에 없고 PIN.json이 sha256을 고정한다.
  const allowedPaths = new Set<string>([
    ...Object.keys(expectedDigests),
    pin.manifest,
    ...MIRROR_OWN_FILES,
  ]);
  for (const filePath of files.keys()) {
    if (!allowedPaths.has(filePath)) {
      problems.push(`manifest 목록 밖 파일: ${filePath}`);
    }
  }

  return problems;
};
