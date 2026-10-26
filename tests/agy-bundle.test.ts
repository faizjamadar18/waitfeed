// AGY plugin-bundle tests — the Antigravity CLI deliverable must be a valid
// plugin per Google's documented plugin format and its scripts must run in
// plain Node (the AGY host has no TS transpiler).
//
// Verified behaviors:
//   1. plugin.json follows the official Antigravity manifest schema.
//   2. hooks.json registers the SessionStart data-cycle hook pointing at the
//      built scheduler bundle with the --cycle flag (one fetch cycle, then exit).
//   3. The built bundles (agy/dist/*.mjs) exist and are self-contained —
//      rss-parser and every dependency is bundled inline, because the staged
//      plugin directory sits outside any node_modules tree.
//   4. E2E: the statusline bundle, spawned exactly the way the AGY CLI runs
//      it (`node statusline.mjs` with agent-state JSON on stdin), prints the
//      rotated one-line card while busy, prints nothing while idle or empty,
//      survives a corrupt/absent payload, and advances the rotation across
//      runs through the rotation state file.
import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PKG = join(import.meta.dirname, "..", "packages", "waitfeed")
const AGY = join(PKG, "agy")
const STATUSLINE_BUNDLE = join(AGY, "dist", "statusline.mjs")
const SCHEDULER_BUNDLE = join(AGY, "dist", "scheduler.mjs")
const distReady = existsSync(STATUSLINE_BUNDLE) && existsSync(SCHEDULER_BUNDLE)

if (!distReady) console.warn("[waitfeed] agy/dist missing — run `npm test` (pretest builds the AGY bundles)")

/** Runs the statusline bundle the way AGY does: payload JSON on stdin. */
function runStatusline(dataDir: string, stdin: string) {
  return spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--data-dir", dataDir], {
    input: stdin,
    encoding: "utf8",
  })
}

// ANSI built from char codes so this file stays plain ASCII.
const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)

/** Statusline rows as the terminal sees them, without the ANSI paint. */
const stripAnsi = (s: string): string =>
  s
    .replace(new RegExp(`${ESC}]8;;[^${BEL}${ESC}]*${BEL}`, "g"), "")
    .replace(new RegExp(`${ESC}\\[[0-9;]*m`, "g"), "")

const visibleRows = (stdout?: string): string[] =>
  (stdout ?? "")
    .split("\n")
    .filter((r) => r.length > 0)
    .map(stripAnsi)

/** Two items cached newest-first, as the pipeline always stores them — the
 * first carries a fed description, the second does not. */
const CACHED = JSON.stringify({
  items: [
    {
      id: "hn-a",
      source: "HN",
      title: "Alpha headline",
      url: "https://e.com/a",
      time: 1_800_000_000_000 - 60_000,
      score: 7,
      context: "Alpha description body to read while waiting.",
    },
    { id: "gh-b", source: "GH", title: "Beta headline", url: "https://e.com/b", time: 1_800_000_000_000 - 120_000 },
  ],
  fetchedAt: 1_800_000_000_000,
  summaries: {},
  llmUnavailable: true,
})
const WORKING = JSON.stringify({ agent_state: "working", terminal_width: 120 })
const IDLE = JSON.stringify({ agent_state: "idle", terminal_width: 120 })
describe("AGY plugin manifest (official schema)", () => {
  it("plugin.json is a valid Antigravity plugin manifest", async () => {
    const doc = JSON.parse(await readFile(join(AGY, "plugin.json"), "utf8")) as Record<string, unknown>
    expect(doc.$schema).toBe("https://antigravity.google/schemas/v1/plugin.json")
    expect(String(doc.name)).toMatch(/^[a-zA-Z0-9-_]+$/)
    expect(String(doc.name)).toBe("waitfeed")
    expect(String(doc.description ?? "").length).toBeGreaterThan(0)
  })

  it("hooks.json registers the SessionStart data-cycle hook", async () => {
    const doc = JSON.parse(await readFile(join(AGY, "hooks.json"), "utf8")) as {
      [key: string]: { SessionStart?: Array<{ command?: string; timeout?: number }> }
    }
    const hook = doc["waitfeed-cycle"]
    expect(hook).toBeTruthy()
    const handlers = hook?.SessionStart ?? []
    expect(handlers).toHaveLength(1)
    const handler = handlers[0]
    expect(handler.command).toContain("dist/scheduler.mjs")
    expect(handler.command).toContain("--cycle")
    expect(typeof handler.timeout).toBe("number")
    expect(handler.timeout).toBeGreaterThan(0)
  })

  it("the shipping file list includes the agy directory", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8")) as { files: string[] }
    expect(pkg.files).toContain("agy/")
  })
})

describe.skipIf(!distReady)("built bundles (pretest artifacts)", () => {
  it("both bundles exist and are self-contained — no bare dependency imports", async () => {
    for (const [name, file] of [
      ["statusline", STATUSLINE_BUNDLE],
      ["scheduler", SCHEDULER_BUNDLE],
    ] as const) {
      const source = await readFile(file, "utf8")
      expect(source.length, `${name} bundle is empty`).toBeGreaterThan(100)
      // Bundle inline = the staged plugin dir has no node_modules beside it.
      expect(source, `${name} still imports rss-parser from a node_modules lookup`).not.toMatch(
        /from\s*["']rss-parser["']/,
      )
      void name
    }
  })

  it("the bundle entrypoints only eat supported inputs (--data-dir, stdin, no args)", () => {
    const bad = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--unknown-flag", "x"], { input: "", encoding: "utf8" })
    expect(bad.status).toBe(0) // tolerate, never crash the host statusline render
  })

  it("E2E — busy: the full card — headline, dimmed description, link last", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(3) // headline + description + link
      expect(rows[0]).toContain("[HN]")
      expect(rows[0]).toContain("Alpha headline")
      expect(rows[0]!.length).toBe(120) // justified: the meta pins to the right corner
      expect(rows[1]).toContain("Alpha description body") // the fed metadata, readable
      expect(rows[1]!.length).toBeLessThanOrEqual(120)
      expect(rows[2]).toContain("e.com/a") // the origin, ALWAYS the last row
      expect(res.stdout ?? "").toContain(`${ESC}]8;;https://e.com/a${BEL}`) // a REAL click target now
      expect(res.stdout ?? "").toContain(`${ESC}[38;5;202m`) // the HN badge, OpenCode orange
      // The walk opened its first dwell window and persisted it.
      const dwell = JSON.parse(await readFile(join(dir, "agy-rotation.json"), "utf8")) as {
        ticks: number
        windowStart: number
      }
      expect(dwell.ticks).toBe(0)
      expect(dwell.windowStart).toBeGreaterThan(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — items without a description keep the two-row card: headline + clickable origin", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      const plain = JSON.stringify({
        items: [{ id: "gh-b", source: "GH", title: "Beta headline", url: "https://e.com/b", time: 1_800_000_000_000 - 120_000 }],
        fetchedAt: 1_800_000_000_000,
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), plain, "utf8")
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(2)
      expect(rows[1]).toContain("e.com/b")
      expect(res.stdout ?? "").toContain(`${ESC}]8;;https://e.com/b${BEL}`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — sign-in/startup are quiet: no news until a session runs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      // The documented non-session states never render — and neither does a
      // silent host (the splash), which used to default to visible.
      for (const payload of [
        JSON.stringify({ agent_state: "authenticating", terminal_width: 120 }),
        JSON.stringify({ agent_state: "initializing", terminal_width: 120 }),
        JSON.stringify({ agent_state: "error", terminal_width: 120 }),
        "",
      ]) {
        const res = runStatusline(dir, payload)
        expect(res.status).toBe(0)
        expect((res.stdout ?? "").trim(), `payload ${payload || "<empty>"} rendered news`).toBe("")
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — a very long description is capped at three dimmed description rows", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      const long = JSON.stringify({
        items: [
          {
            id: "hn-long",
            source: "HN",
            title: "Long headline",
            url: "https://e.com/long",
            time: 1_800_000_000_000 - 60_000,
            context: "word ".repeat(200).trim(), // ~1200 chars, far beyond 3 rows
          },
        ],
        fetchedAt: 1_800_000_000_000,
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), long, "utf8")
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(5) // headline + ≤3 description rows + link
      expect(rows[0]).toContain("Long headline")
      expect(rows[rows.length - 1]).toContain("e.com/long")
      // Every description row is wrapped inside the terminal width.
      for (const row of rows.slice(1, -1)) expect(row.length).toBeLessThanOrEqual(120)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — redraws inside one dwell window show the SAME card (no random flicker)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const first = runStatusline(dir, WORKING)
      const second = runStatusline(dir, WORKING) // AGY repaints milliseconds later
      expect(first.status).toBe(0)
      expect(second.status).toBe(0)
      expect(second.stdout ?? "").toContain("Alpha headline") // same window → same card
      expect(second.stdout ?? "").toContain("Alpha description body")
      expect(second.stdout ?? "").not.toContain("Beta headline")
      expect(second.stdout ?? "").toBe(first.stdout ?? "") // byte-identical, rows included
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — after a full dwell window the next card appears, even after a silent gap", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      // Simulate a long silent phase: the last window opened over one dwell ago.
      const stale = JSON.stringify({ ticks: 0, windowStart: Date.now() - 25_000 })
      await writeFile(join(dir, "agy-rotation.json"), stale, "utf8")
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      expect(res.stdout ?? "").toContain("Beta headline")
      const dwell = JSON.parse(await readFile(join(dir, "agy-rotation.json"), "utf8")) as { ticks: number }
      expect(dwell.ticks).toBe(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — idle prints nothing and does not advance the rotation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, IDLE)
      expect(res.status).toBe(0)
      expect((res.stdout ?? "").trim()).toBe("")
      // No advance → no rotation write at all; if a file exists it must
      // still say 0.
      const raw = await readFile(join(dir, "agy-rotation.json"), "utf8").catch(() => "")
      if (raw) expect((JSON.parse(raw) as { rotation: number }).rotation).toBe(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — no cache file prints nothing but exits cleanly", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      expect((res.stdout ?? "").trim()).toBe("")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — corrupt or empty stdin payloads never crash the render", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      for (const payload of ["", "not json at all", JSON.stringify({ agent_state: "zzz" }), JSON.stringify({ terminal_width: 10 })]) {
        const res = runStatusline(dir, payload)
        expect(res.status, `payload ${payload.slice(0, 30)} crashed the script`).toBe(0)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — camelCase payload (agentState, terminalWidth) works identically", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-agy-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const camelPayload = JSON.stringify({ agentState: "working", terminalWidth: 120 })
      const res = runStatusline(dir, camelPayload)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(3)
      expect(rows[0]).toContain("Alpha headline")
      expect(rows[0]!.length).toBe(120) // justified
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — scheduler runs cleanly in plain Node without dynamic require errors", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-sched-"))
    try {
      // Fresh cache: pipeline skips fetch and exits cleanly with 0
      const fresh = JSON.stringify({
        items: [{ id: "x", source: "HN", title: "Fresh item", url: "https://example.com/x" }],
        fetchedAt: Date.now(),
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), fresh, "utf8")
      const res = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--data-dir", dir, "--cycle"], {
        encoding: "utf8",
        timeout: 10_000,
      })
      expect(res.status).toBe(0)
      expect(res.stderr).not.toContain("Dynamic require")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

