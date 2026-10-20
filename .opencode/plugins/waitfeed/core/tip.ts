// WaitFeed personal tips — the "▍ YOU" slots between the headlines.
//
// Built ONLY from local git metadata (status/porcelain + last commits).
// Never file contents, never network. The number of tips is small and honest:
// uncommitted changes, commits today with the last subject. Pure helpers are
// unit-tested; gitTips() is the only I/O and degrades to [] wherever git or
// the repo is unavailable.
import { execFile, spawn } from "node:child_process"
import { truncate } from "./ticker"

export interface GitFacts {
  /** Working-tree changes (staged + unstaged + untracked). */
  dirty: number
  /** Commits with a commit date since midnight today. */
  commitsToday: number
  /** Subject of the most recent commit of the day. */
  lastSubject?: string
}

/** Count non-empty porcelain lines — one change each. */
export function parsePorcelain(out: string): number {
  return out.split("\n").filter((l) => l.trim().length > 0).length
}

/** Parse "%ct|%s" log lines. Subjects may contain "|"; everything after the
 * first separator is the subject. Malformed lines are skipped. */
export function parseLogLines(out: string): { epoch: number; subject: string }[] {
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((l) => {
      const idx = l.indexOf("|")
      if (idx <= 0) return []
      const epoch = Number(l.slice(0, idx))
      if (!Number.isFinite(epoch) || epoch <= 0) return []
      return [{ epoch: epoch * 1000, subject: l.slice(idx + 1).trim() }]
    })
}

/** Turn bare facts into short "▍ YOU" lines — nothing guessed beyond git. */
export function tipsFromFacts(f: GitFacts, maxLen = 90): string[] {
  const tips: string[] = []
  if (f.dirty > 0) {
    const noun = f.dirty === 1 ? "1 uncommitted change" : `${f.dirty} uncommitted changes`
    tips.push(truncate(noun, maxLen))
  }
  if (f.commitsToday > 0) {
    const head = f.commitsToday === 1 ? "1 commit today" : `${f.commitsToday} commits today`
    const line = f.lastSubject ? `${head} · last: "${f.lastSubject}"` : head
    tips.push(truncate(line, maxLen))
  }
  if (tips.length === 0) tips.push("commit history is quiet today — the agent's on it")
  return tips.slice(0, 3)
}

/** Same as tipsFromFacts, straight from raw command output (testable without git). */
export function tipsFromGitOutput(porcelain: string, log: string): string[] {
  const commits = parseLogLines(log)
  const facts: GitFacts = {
    dirty: parsePorcelain(porcelain),
    commitsToday: commits.length,
    lastSubject: commits[0] ? truncate(commits[0].subject, 48) : undefined,
  }
  return tipsFromFacts(facts)
}

const run = (cwd: string, args: string[], timeoutMs: number): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile("git", args, { cwd, timeout: timeoutMs, windowsHide: true }, (err, stdout) => {
      if (err) reject(err)
      else resolve(String(stdout).trim())
    })
  })

/** One git probe per refresh cycle. Never reads file contents — metadata only. */
export async function gitTips(cwd: string, timeoutMs = 4_000): Promise<string[]> {
  try {
    const [status, log] = await Promise.all([
      run(cwd, ["status", "--porcelain=v1"], timeoutMs),
      run(cwd, ["log", "--pretty=format:%ct|%s", "--since=midnight", "--max-count=50"], timeoutMs),
    ])
    return tipsFromGitOutput(status, log)
  } catch {
    return [] // not a git repo, no git binary, or a hung git — no tips, never an error
  }
}
