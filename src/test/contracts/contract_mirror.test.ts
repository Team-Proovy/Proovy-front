import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BROWSER_RUN_CONSUMER_VERSION } from "@/shared/contracts/browser_run_v1";
import {
  readContractPin,
  readMirrorFiles,
  verifyContractMirror,
  type ContractPin,
} from "./contract_mirror";

const SCHEMA_PATH = "browser-run-v1/schemas/browser-run.schema.json";

describe("browser-run-v1 검증된 사본", () => {
  const pin = readContractPin();
  const files = readMirrorFiles();

  it("사본이 PIN.json·manifest sha256과 일치한다", () => {
    expect(
      verifyContractMirror(pin, files, BROWSER_RUN_CONSUMER_VERSION),
    ).toEqual([]);
  });

  it("사본 파일 하나라도 바뀌면 실패한다", () => {
    const tamperedFiles = new Map(files);
    const original = tamperedFiles.get(SCHEMA_PATH)!;
    tamperedFiles.set(SCHEMA_PATH, new Uint8Array([...original, 0x0a]));

    expect(
      verifyContractMirror(pin, tamperedFiles, BROWSER_RUN_CONSUMER_VERSION),
    ).toEqual([`sha256 불일치(사본 변조): ${SCHEMA_PATH}`]);
  });

  it("dependency(terminal-v2 schema)가 바뀌어도 실패한다", () => {
    const dependencyPath = "terminal-v2/browser.schema.json";
    const tamperedFiles = new Map(files);
    tamperedFiles.set(dependencyPath, new TextEncoder().encode("{}"));

    expect(
      verifyContractMirror(pin, tamperedFiles, BROWSER_RUN_CONSUMER_VERSION),
    ).toEqual([`sha256 불일치(사본 변조): ${dependencyPath}`]);
  });

  it("manifest가 바뀌면 pin 불일치로 실패한다", () => {
    const tamperedFiles = new Map(files);
    const manifestText = new TextDecoder().decode(
      tamperedFiles.get(pin.manifest)!,
    );
    tamperedFiles.set(
      pin.manifest,
      new TextEncoder().encode(`${manifestText} `),
    );

    const problems = verifyContractMirror(
      pin,
      tamperedFiles,
      BROWSER_RUN_CONSUMER_VERSION,
    );
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(
      /^manifest sha256 .* ≠ PIN.json manifest_sha256/,
    );
  });

  it("PIN.json이 다른 manifest·version을 가리키면 실패한다", () => {
    const stalePin: ContractPin = {
      ...pin,
      consumer_version: "browser-run-fixtures-v2",
      manifest_sha256: "0".repeat(64),
    };

    const problems = verifyContractMirror(
      stalePin,
      files,
      BROWSER_RUN_CONSUMER_VERSION,
    );
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^PIN.json consumer_version browser-run-fixtures-v2 ≠/,
        ),
        expect.stringMatching(
          /^manifest sha256 .* ≠ PIN.json manifest_sha256 0{64}$/,
        ),
        expect.stringMatching(
          /^manifest consumer_version browser-run-fixtures-v1 ≠ PIN.json/,
        ),
      ]),
    );
  });

  it("코드의 consumer_version이 pin과 다르면 실패한다", () => {
    expect(verifyContractMirror(pin, files, "browser-run-fixtures-v0")).toEqual(
      [
        "PIN.json consumer_version browser-run-fixtures-v1 ≠ 코드 기대값 browser-run-fixtures-v0",
      ],
    );
  });

  it("파일이 빠지거나 목록 밖 파일이 생기면 실패한다", () => {
    const changedFiles = new Map(files);
    changedFiles.delete("browser-run-v1/heartbeat.txt");
    changedFiles.set(
      "browser-run-v1/streams/valid/extra.json",
      new Uint8Array(),
    );

    expect(
      verifyContractMirror(pin, changedFiles, BROWSER_RUN_CONSUMER_VERSION),
    ).toEqual([
      "사본에 파일 없음: browser-run-v1/heartbeat.txt",
      "manifest 목록 밖 파일: browser-run-v1/streams/valid/extra.json",
    ]);
  });
});

// 로컬 전용: PROOVY_SERVER_DIR=<Proovy-server checkout>이면 Server pin과 같은지 확인한다.
const serverDir = process.env.PROOVY_SERVER_DIR;
const serverPinPath =
  serverDir &&
  path.join(serverDir, "src/test/resources/contracts/brain/PIN.json");

describe.skipIf(!serverPinPath || !existsSync(serverPinPath))(
  "Server pin 일치",
  () => {
    it("Front PIN.json이 Server PIN.json과 같은 commit·version·manifest를 가리킨다", () => {
      const serverPin = JSON.parse(
        readFileSync(serverPinPath!, "utf8"),
      ) as ContractPin;
      const frontPin = readContractPin();

      expect({
        commit: frontPin.commit,
        consumer_version: frontPin.consumer_version,
        manifest: frontPin.manifest,
        manifest_sha256: frontPin.manifest_sha256,
      }).toEqual({
        commit: serverPin.commit,
        consumer_version: serverPin.consumer_version,
        manifest: serverPin.manifest,
        manifest_sha256: serverPin.manifest_sha256,
      });
    });
  },
);
