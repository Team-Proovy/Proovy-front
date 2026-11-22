// @vitest-environment node
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../..");

const extractStepRunBlock = (workflow: string, stepName: string): string => {
  const stepMarker = `- name: ${stepName}`;
  const start = workflow.indexOf(stepMarker);
  if (start === -1) {
    throw new Error(`Step not found: ${stepName}`);
  }
  const rest = workflow.slice(start);
  const runMatch = rest.match(/\n\s+run:\s*\|\n([\s\S]*?)(?=\n\s+- name:|\s*$)/);
  if (!runMatch) {
    throw new Error(`Multiline run block not found for step: ${stepName}`);
  }
  const lines = runMatch[1].split("\n");
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce(
      (min, line) => Math.min(min, line.match(/^(\s*)/)?.[1].length ?? 0),
      Infinity,
    );
  return lines.map((line) => line.slice(minIndent)).join("\n");
};

const runBashBlock = (
  script: string,
  env: Record<string, string>,
  cwd?: string,
): { status: number; stdout: string; stderr: string } => {
  try {
    const stdout = execFileSync("bash", ["-euo", "pipefail", "-c", script], {
      cwd,
      env: { ...process.env, ...env },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const err = error as {
      status?: number;
      stdout?: Buffer | string;
      stderr?: Buffer | string;
    };
    return {
      status: err.status ?? 1,
      stdout: err.stdout?.toString() ?? "",
      stderr: err.stderr?.toString() ?? "",
    };
  }
};

describe("Deployment config contract (Task 2.32)", () => {
  const deployYml = readFileSync(
    path.join(REPO_ROOT, ".github/workflows/deploy.yml"),
    "utf8",
  );

  it("removes /api/** Cloud Run rewrite and hardcoded site from firebase.json while keeping SPA fallback", () => {
    const firebaseConfig = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "firebase.json"), "utf8"),
    ) as {
      hosting: {
        site?: string;
        public: string;
        rewrites: Array<{
          source: string;
          destination?: string;
          run?: unknown;
        }>;
      };
    };

    expect(firebaseConfig.hosting.site).toBeUndefined();
    expect(firebaseConfig.hosting.public).toBe("dist");
    expect(
      firebaseConfig.hosting.rewrites.some(
        (rule) => rule.source.startsWith("/api") || rule.run !== undefined,
      ),
    ).toBe(false);
    expect(firebaseConfig.hosting.rewrites).toEqual([
      {
        source: "**",
        destination: "/index.html",
      },
    ]);
  });

  it("uses workflow_dispatch environment selection and WIF without static JSON keys or unused VITE vars in deploy.yml", () => {
    expect(deployYml).toContain("workflow_dispatch:");
    expect(deployYml).toContain("- staging");
    expect(deployYml).toContain("- production");
    expect(deployYml).toContain("id-token: write");
    expect(deployYml).toContain("environment: ${{ inputs.environment }}");
    expect(deployYml).toContain("inputs.environment == 'staging'");
    expect(deployYml).toContain("google-github-actions/auth@v2");
    expect(deployYml).toContain("vars.WIF_PROVIDER");
    expect(deployYml).toContain("vars.DEPLOY_SA_EMAIL");
    expect(deployYml).toContain("VITE_API_BASE_URL: ${{ env.SERVER_URL }}");
    expect(deployYml).toContain("VITE_APP_BASE_URL:");

    expect(deployYml).not.toContain("FIREBASE_SERVICE_ACCOUNT");
    expect(deployYml).not.toContain("GCP_SA_KEY");
    expect(deployYml).not.toContain("VITE_AGENT_BASE_URL");
    expect(deployYml).not.toContain("VITE_TLDRAW_LICENSE_KEY");
  });

  it("resolves and validates Cloud Run Server URL against selected GCP project and rejects empty/invalid/mismatched values", () => {
    const script = extractStepRunBlock(
      deployYml,
      "Resolve Server Cloud Run URL",
    );
    const workDir = mkdtempSync(path.join(tmpdir(), "proovy-deploy-url-"));
    try {
      const binDir = path.join(workDir, "bin");
      execFileSync("mkdir", ["-p", binDir]);
      const gcloudStub = path.join(binDir, "gcloud");
      writeFileSync(
        gcloudStub,
        '#!/usr/bin/env bash\nprintf "%s\\n" "${STUB_GCLOUD_URL:-}"\n',
      );
      chmodSync(gcloudStub, 0o755);

      const githubEnv = path.join(workDir, "github_env");
      const baseEnv = {
        PATH: `${binDir}:${process.env.PATH ?? ""}`,
        GITHUB_ENV: githubEnv,
        GCP_PROJECT_ID: "proovy-staging-123",
        GCP_REGION: "asia-northeast3",
        CONFIGURED_SERVER_URL: "",
      };

      writeFileSync(githubEnv, "");
      const ok = runBashBlock(script, {
        ...baseEnv,
        STUB_GCLOUD_URL:
          "https://proovy-server-api-123456.asia-northeast3.run.app",
      });
      expect(ok.status).toBe(0);
      expect(readFileSync(githubEnv, "utf8")).toContain(
        "SERVER_URL=https://proovy-server-api-123456.asia-northeast3.run.app",
      );

      writeFileSync(githubEnv, "");
      const matchingOverride = runBashBlock(script, {
        ...baseEnv,
        STUB_GCLOUD_URL:
          "https://proovy-server-api-123456.asia-northeast3.run.app",
        CONFIGURED_SERVER_URL:
          "https://proovy-server-api-123456.asia-northeast3.run.app/",
      });
      expect(matchingOverride.status).toBe(0);

      const emptyUrl = runBashBlock(script, {
        ...baseEnv,
        STUB_GCLOUD_URL: "",
      });
      expect(emptyUrl.status).not.toBe(0);

      const invalidHost = runBashBlock(script, {
        ...baseEnv,
        STUB_GCLOUD_URL: "https://legacy.example/api",
      });
      expect(invalidHost.status).not.toBe(0);

      const mismatch = runBashBlock(script, {
        ...baseEnv,
        STUB_GCLOUD_URL:
          "https://proovy-server-api-123456.asia-northeast3.run.app",
        CONFIGURED_SERVER_URL:
          "https://proovy-server-api-999999.asia-northeast3.run.app",
      });
      expect(mismatch.status).not.toBe(0);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("requires explicit FIREBASE_HOSTING_SITE distinct from project ID and preserves SPA fallback", () => {
    const script = extractStepRunBlock(
      deployYml,
      "Deploy to Firebase Hosting",
    );
    const workDir = mkdtempSync(path.join(tmpdir(), "proovy-deploy-site-"));
    try {
      const binDir = path.join(workDir, "bin");
      execFileSync("mkdir", ["-p", binDir]);
      const pnpmStub = path.join(binDir, "pnpm");
      const pnpmArgsLog = path.join(workDir, "pnpm_args.log");
      writeFileSync(
        pnpmStub,
        `#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "${pnpmArgsLog}"\n`,
      );
      chmodSync(pnpmStub, 0o755);

      const firebaseCopy = path.join(workDir, "firebase.json");
      writeFileSync(
        firebaseCopy,
        readFileSync(path.join(REPO_ROOT, "firebase.json"), "utf8"),
      );

      const missingSite = runBashBlock(
        script,
        {
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
          GCP_PROJECT_ID: "proovy-staging-proj",
          FIREBASE_HOSTING_SITE: "",
        },
        workDir,
      );
      expect(missingSite.status).not.toBe(0);

      const validSite = runBashBlock(
        script,
        {
          PATH: `${binDir}:${process.env.PATH ?? ""}`,
          GCP_PROJECT_ID: "proovy-staging-proj",
          FIREBASE_HOSTING_SITE: "proovy-staging-web",
        },
        workDir,
      );
      expect(validSite.status).toBe(0);

      const updatedFirebase = JSON.parse(readFileSync(firebaseCopy, "utf8")) as {
        hosting: { site?: string; rewrites: unknown[] };
      };
      expect(updatedFirebase.hosting.site).toBe("proovy-staging-web");
      expect(updatedFirebase.hosting.rewrites).toEqual([
        { source: "**", destination: "/index.html" },
      ]);
      expect(readFileSync(pnpmArgsLog, "utf8")).toContain(
        "dlx firebase-tools@13 deploy --only hosting --project proovy-staging-proj --non-interactive",
      );
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("enforces Kakao-only in staging (clearing Naver) and requires both Kakao & Naver in production", () => {
    const script = extractStepRunBlock(
      deployYml,
      "Resolve OAuth Environment Variables",
    );
    const workDir = mkdtempSync(path.join(tmpdir(), "proovy-deploy-oauth-"));
    try {
      const githubEnv = path.join(workDir, "github_env");
      writeFileSync(githubEnv, "");

      const stagingOk = runBashBlock(script, {
        GITHUB_ENV: githubEnv,
        TARGET_ENV: "staging",
        RAW_KAKAO_CLIENT_ID: "staging-kakao-id",
        RAW_KAKAO_REDIRECT_URI:
          "https://proovy-staging-web.web.app/oauth/kakao/callback",
        RAW_NAVER_CLIENT_ID: "leaked-org-naver-id",
        RAW_NAVER_REDIRECT_URI: "https://leaked/oauth/naver/callback",
      });
      expect(stagingOk.status).toBe(0);
      const stagingOut = readFileSync(githubEnv, "utf8");
      expect(stagingOut).toContain("RESOLVED_KAKAO_CLIENT_ID=staging-kakao-id");
      expect(stagingOut).toContain("RESOLVED_NAVER_CLIENT_ID=\n");
      expect(stagingOut).toContain("RESOLVED_NAVER_REDIRECT_URI=\n");

      const stagingMissingKakao = runBashBlock(script, {
        GITHUB_ENV: githubEnv,
        TARGET_ENV: "staging",
        RAW_KAKAO_CLIENT_ID: "",
        RAW_KAKAO_REDIRECT_URI: "",
        RAW_NAVER_CLIENT_ID: "",
        RAW_NAVER_REDIRECT_URI: "",
      });
      expect(stagingMissingKakao.status).not.toBe(0);

      const prodMissingNaver = runBashBlock(script, {
        GITHUB_ENV: githubEnv,
        TARGET_ENV: "production",
        RAW_KAKAO_CLIENT_ID: "prod-kakao-id",
        RAW_KAKAO_REDIRECT_URI: "https://proovy.ai.kr/oauth/kakao/callback",
        RAW_NAVER_CLIENT_ID: "",
        RAW_NAVER_REDIRECT_URI: "",
      });
      expect(prodMissingNaver.status).not.toBe(0);

      writeFileSync(githubEnv, "");
      const prodOk = runBashBlock(script, {
        GITHUB_ENV: githubEnv,
        TARGET_ENV: "production",
        RAW_KAKAO_CLIENT_ID: "prod-kakao-id",
        RAW_KAKAO_REDIRECT_URI: "https://proovy.ai.kr/oauth/kakao/callback",
        RAW_NAVER_CLIENT_ID: "prod-naver-id",
        RAW_NAVER_REDIRECT_URI: "https://proovy.ai.kr/oauth/naver/callback",
      });
      expect(prodOk.status).toBe(0);
      expect(readFileSync(githubEnv, "utf8")).toContain(
        "RESOLVED_NAVER_CLIENT_ID=prod-naver-id",
      );
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
