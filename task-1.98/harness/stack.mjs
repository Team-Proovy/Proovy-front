import { execFileSync } from "child_process";
import fs from "fs";
const DIR = "/home/chowon442/coding-workspace/.worktree/Proovy-front/worktree-task-1.98/scripts/local-stack";
export const compose = (...a) => execFileSync("docker", ["compose", ...a], { cwd: DIR, encoding: "utf8" });
export function newToken(S) {
  const out = compose("exec", "-T", "postgres", "issue-token");
  const [head, token] = out.split("\n");
  fs.writeFileSync(`${S}/token`, token.trim());
  console.log(head);
}
