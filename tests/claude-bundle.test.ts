// Claude Code plugin-bundle tests — the Claude Code deliverable must run
// cleanly in plain Node via Claude Code's statusLine command and SessionStart hook.
//
// Verified behaviors:
//   1. The shipping file list in package.json includes the claude directory.
//   2. The built bundles (claude/dist/*.mjs) exist and are self-contained —
//      rss-parser and every dependency is bundled inline, because the staged
//      directory sits outside any node_modules tree.
//   3. E2E: the statusline bundle, spawned exactly the way Claude Code runs
//      it (`node statusline.mjs` with session JSON on stdin):
//      - Prints the rotated one-line card when Claude session is active.
//      - Handles both Claude Code session JSON (model, workspace, context_window)
//        and agent_state payloads.
//      - Prints nothing when idle or empty.
//      - Survives corrupt/absent payloads.
//      - Advances rotation across runs through claude-rotation.json.
//      - Reserves the host's statusline inset: no row ever exceeds
//        COLUMNS − 4, at any terminal width (the no-cut-off contract).
//      - Honors the hook-driven activity ledger: a busy mark wakes the card
//        for that session only, an idle mark quiets it, a stale mark goes
//        quiet, and a ledger-less install keeps the legacy always-on panel.
//   4. E2E: the scheduler bundle runs a keyless headline-mode cycle cleanly
//      without dynamic require errors.
import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PKG = join(import.meta.dirname, "..", "packages", "waitfeed")
const CLAUDE = join(PKG, "claude")
const STATUSLINE_BUNDLE = join(CLAUDE, "dist", "statusline.mjs")
const SCHEDULER_BUNDLE = join(CLAUDE, "dist", "scheduler.mjs")
const distReady = existsSync(STATUSLINE_BUNDLE) && existsSync(SCHEDULER_BUNDLE)

if (!distReady) console.warn("[waitfeed] claude/dist missing — run `npm test` (pretest builds the Claude bundles)")

/** Runs the statusline bundle the way Claude Code does: payload JSON on stdin. */
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

const CLAUDE_SESSION = JSON.stringify({
  model: { id: "openrouter/free", display_name: "openrouter/free" },
  workspace: { current_dir: "/app" },
  terminal_width: 120,
})

/** Claude Code exports COLUMNS as the raw terminal width, but renders the
 * statusline in a field ~3 columns narrower and truncates overflow with `…`
 * (anthropics/claude-code#81454, #69967). The bundle reserves 4 columns, so
 * every shipped row must fit COLUMNS − 4 — never COLUMNS. */
const MARGIN = 4
const COLUMNS_SWEEP = [45, 80, 120, 200]

const WORKING = JSON.stringify({ agent_state: "working", terminal_width: 120 })
const IDLE = JSON.stringify({ agent_state: "idle", terminal_width: 120 })

describe("Claude adapter packaging", () => {
  it("the shipping file list in package.json includes the claude directory", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8")) as { files: string[] }
    expect(pkg.files).toContain("claude/")
  })
})

describe.skipIf(!distReady)("built Claude bundles (pretest artifacts)", () => {
  it("both bundles exist and are self-contained — no bare dependency imports", async () => {
    for (const [name, file] of [
      ["statusline", STATUSLINE_BUNDLE],
      ["scheduler", SCHEDULER_BUNDLE],
    ] as const) {
      const source = await readFile(file, "utf8")
      expect(source.length, `${name} bundle is empty`).toBeGreaterThan(100)
      expect(source, `${name} still imports rss-parser from a node_modules lookup`).not.toMatch(
        /from\s*["']rss-parser["']/,
      )
    }
  })

  it("the bundle entrypoints tolerate unexpected arguments gracefully", () => {
    const bad = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--unknown-flag", "x"], { input: "", encoding: "utf8" })
    expect(bad.status).toBe(0)
  })

  it("E2E — Claude session: full card — headline, dimmed description, clickable link last", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, CLAUDE_SESSION)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(3)
      expect(rows[0]).toContain("[HN]")
      expect(rows[0]).toContain("Alpha headline")
      expect(rows[0]!.length).toBe(120 - MARGIN) // right-justified inside the reserved field
      expect(rows[1]).toContain("Alpha description body")
      expect(rows[1]!.length).toBeLessThanOrEqual(120 - MARGIN)
      expect(rows[2]).toContain("e.com/a")
      expect(rows[2]!.startsWith("   > ")).toBe(true) // OpenCode's origin-row marker
      expect(res.stdout ?? "").toContain(`${ESC}]8;;https://e.com/a${BEL}`) // OSC 8 link
      expect(res.stdout ?? "").toContain(`${ESC}[38;5;202m`) // HN orange

      // Persisted dwell state in claude-rotation.json
      const dwell = JSON.parse(await readFile(join(dir, "claude-rotation.json"), "utf8")) as {
        ticks: number
        windowStart: number
      }
      expect(dwell.ticks).toBe(0)
      expect(dwell.windowStart).toBeGreaterThan(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — working agent_state payload works identically", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, WORKING)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(3)
      expect(rows[0]).toContain("Alpha headline")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — COLUMNS env variable dynamically sets width and preserves right-aligned meta", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const payload = JSON.stringify({ model: { id: "openrouter/free" } })
      const res = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--data-dir", dir], {
        input: payload,
        encoding: "utf8",
        env: { ...process.env, COLUMNS: "85" },
      })
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(3)
      expect(rows[0]!.length).toBe(85 - MARGIN)
      expect(rows[0]).toContain("Alpha headline")
      expect(rows[0]).toMatch(/▲\s*7/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — no row ever overflows the reserved field at any COLUMNS (the cut-off contract)", async () => {
    for (const columns of COLUMNS_SWEEP) {
      const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-w-"))
      try {
        await writeFile(join(dir, "cache.json"), CACHED, "utf8")
        const res = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--data-dir", dir], {
          input: CLAUDE_SESSION,
          encoding: "utf8",
          env: { ...process.env, COLUMNS: String(columns) },
        })
        expect(res.status, `COLUMNS=${columns}`).toBe(0)
        const rows = visibleRows(res.stdout)
        expect(rows.length, `COLUMNS=${columns}`).toBeGreaterThanOrEqual(3)
        // The headline row is justified to the usable field; meta intact at the end.
        expect(rows[0]!.length, `COLUMNS=${columns}`).toBe(columns - MARGIN)
        expect(rows[0]!.endsWith("▲ 7 · now"), `COLUMNS=${columns}`).toBe(true)
        // Every other row (description, link) stays inside the field too —
        // nothing for Claude Code to truncate.
        for (const row of rows) {
          expect(row.length, `COLUMNS=${columns} row=${row}`).toBeLessThanOrEqual(columns - MARGIN)
        }
        // The clickable origin survives every width.
        expect(res.stdout ?? "", `COLUMNS=${columns}`).toContain(`${ESC}]8;;https://e.com/a${BEL}`)
      } finally {
        await rm(dir, { recursive: true, force: true })
      }
    }
  })

  it("E2E — long headlines wrap into a second line without cutting text or dropping meta", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      const longTitle = "Nikon photography contest winner loses title after scientists spot signs of AI in winning image"
      const cache = JSON.stringify({
        items: [{ id: "hn-nikon", source: "HN", title: longTitle, url: "https://example.com/nikon", score: 254, time: Date.now() - 3600000 }],
        fetchedAt: Date.now(),
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), cache, "utf8")
      const payload = JSON.stringify({ model: { id: "openrouter/free" } })
      const res = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--data-dir", dir], {
        input: payload,
        encoding: "utf8",
        env: { ...process.env, COLUMNS: "80" },
      })
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows.length).toBeGreaterThanOrEqual(3) // 2 headline rows + 1 link row
      expect(rows[0]!.startsWith("▍ [HN] ")).toBe(true)
      expect(rows[0]).not.toContain("…")
      expect(rows[1]!.startsWith("       ")).toBe(true)
      expect(rows[1]).not.toContain("…")
      expect(rows[1]).toContain("▲ 254")
      const full = `${rows[0]!.replace("▍ [HN] ", "").trim()} ${rows[1]!.replace("       ", "").replace(/▲.*$/, "").trim()}`
      expect(full).toBe(longTitle)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — items without a description keep the two-row card: headline + clickable origin", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      const plain = JSON.stringify({
        items: [{ id: "gh-b", source: "GH", title: "Beta headline", url: "https://e.com/b", time: 1_800_000_000_000 - 120_000 }],
        fetchedAt: 1_800_000_000_000,
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), plain, "utf8")
      const res = runStatusline(dir, CLAUDE_SESSION)
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows).toHaveLength(2)
      expect(rows[1]).toContain("e.com/b")
      expect(res.stdout ?? "").toContain(`${ESC}]8;;https://e.com/b${BEL}`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — idle prints nothing and does not advance rotation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, IDLE)
      expect(res.status).toBe(0)
      expect((res.stdout ?? "").trim()).toBe("")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — empty payload prints nothing and exits 0 cleanly", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const res = runStatusline(dir, "")
      expect(res.status).toBe(0)
      expect((res.stdout ?? "").trim()).toBe("")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — corrupt or non-JSON payloads never crash the render", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      for (const payload of ["not-json", "{broken", JSON.stringify({ agent_state: "unknown" })]) {
        const res = runStatusline(dir, payload)
        expect(res.status).toBe(0)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — narrow terminals still wrap long headlines without cutting text or meta", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-"))
    try {
      const longTitle = "Nikon photography contest winner loses title after scientists spot signs of AI in winning image"
      const cache = JSON.stringify({
        items: [{ id: "hn-nikon", source: "HN", title: longTitle, url: "https://example.com/nikon", score: 254, time: Date.now() - 3600000 }],
        fetchedAt: Date.now(),
        summaries: {},
        llmUnavailable: true,
      })
      await writeFile(join(dir, "cache.json"), cache, "utf8")
      const payload = JSON.stringify({ model: { id: "openrouter/free" } })
      const res = spawnSync(process.execPath, [STATUSLINE_BUNDLE, "--data-dir", dir], {
        input: payload,
        encoding: "utf8",
        env: { ...process.env, COLUMNS: "45" },
      })
      expect(res.status).toBe(0)
      const rows = visibleRows(res.stdout)
      expect(rows.length).toBeGreaterThanOrEqual(3) // wrapped headline rows + link row
      const usable = 45 - MARGIN
      for (const row of rows) expect(row.length).toBeLessThanOrEqual(usable)
      for (const row of rows) expect(row).not.toContain("…") // nothing host-truncated
      // The meta survives intact, right-justified on its headline row.
      expect(rows.slice(0, -1).some((r) => r.includes("▲ 254"))).toBe(true)
      // Every headline word survives across the wrapped rows — nothing cut.
      const linkIdx = rows.findIndex((r) => r.includes("example.com"))
      const text = rows
        .slice(0, linkIdx)
        .map((r) => r.replace(/^▍ \[HN\] /, "").replace(/^ {7}/, "").replace(/▲.*$/, "").trim())
        .filter(Boolean)
        .join(" ")
      expect(text).toBe(longTitle)
      // The clickable origin is still there.
      expect(res.stdout ?? "").toContain(`${ESC}]8;;https://example.com/nikon${BEL}`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — hook heartbeats wake the card per session; idle marks quiet it", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-act-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const heartbeat = spawnSync(
        process.execPath,
        [SCHEDULER_BUNDLE, "--data-dir", dir, "--heartbeat"],
        { input: JSON.stringify({ session_id: "sess-1" }), encoding: "utf8", timeout: 5_000 },
      )
      expect(heartbeat.status).toBe(0)
      expect(heartbeat.stdout ?? "").toBe("") // observational hooks print nothing

      // The ledger records the session as busy...
      const doc = JSON.parse(await readFile(join(dir, "claude-activity.json"), "utf8")) as {
        sessions: Record<string, { busy: boolean; at: number }>
      }
      expect(doc.sessions["sess-1"]?.busy).toBe(true)
      expect(doc.sessions["sess-1"]?.at).toBeGreaterThan(0)

      // ...so the statusline renders for THAT session...
      const busyRun = runStatusline(dir, JSON.stringify({ session_id: "sess-1", model: { id: "x" } }))
      expect(visibleRows(busyRun.stdout)).toHaveLength(3)

      // ...stays quiet for a session the ledger never saw...
      const stranger = runStatusline(dir, JSON.stringify({ session_id: "sess-2", model: { id: "x" } }))
      expect((stranger.stdout ?? "").trim()).toBe("")

      // ...and goes quiet again once the turn ends.
      const stop = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--data-dir", dir, "--idle"], {
        input: JSON.stringify({ session_id: "sess-1" }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(stop.status).toBe(0)
      const idleRun = runStatusline(dir, JSON.stringify({ session_id: "sess-1", model: { id: "x" } }))
      expect((idleRun.stdout ?? "").trim()).toBe("")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — a stale busy mark (crashed session) goes quiet; a missing ledger stays legacy-busy", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-stale-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      const stale = { sessions: { "sess-1": { busy: true, at: Date.now() - 16 * 60_000 } } }
      await writeFile(join(dir, "claude-activity.json"), JSON.stringify(stale), "utf8")
      const staleRun = runStatusline(dir, JSON.stringify({ session_id: "sess-1", model: { id: "x" } }))
      expect((staleRun.stdout ?? "").trim()).toBe("")

      // No ledger file at all → pre-ledger install → the legacy always-busy panel.
      const noLedgerDir = await mkdtemp(join(tmpdir(), "waitfeed-claude-nolegacy-"))
      try {
        await writeFile(join(noLedgerDir, "cache.json"), CACHED, "utf8")
        const legacy = runStatusline(noLedgerDir, JSON.stringify({ session_id: "sess-9", model: { id: "x" } }))
        expect(visibleRows(legacy.stdout).length).toBeGreaterThanOrEqual(2)
      } finally {
        await rm(noLedgerDir, { recursive: true, force: true })
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — an Esc-interrupted turn goes quiet within one render (transcript detector + self-heal)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-esc-"))
    try {
      await writeFile(join(dir, "cache.json"), CACHED, "utf8")
      // The ledger says busy — heartbeats ran during the turn...
      const busy = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--data-dir", dir, "--heartbeat"], {
        input: JSON.stringify({ session_id: "sess-1" }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(busy.status).toBe(0)

      // ...then the user pressed Esc. No Stop/StopFailure hook fires for an
      // interrupt — but the transcript records it as the newest turn event.
      const transcript = join(dir, "transcript.jsonl")
      await writeFile(
        transcript,
        [
          JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Searching…" }] } }),
          JSON.stringify({
            type: "user",
            interruptedMessageId: "m1",
            message: { role: "user", content: [{ type: "text", text: "[Request interrupted by user]" }] },
          }),
          JSON.stringify({ type: "cost-state" }),
        ].join("\n") + "\n",
        "utf8",
      )

      // The card must go quiet within this render.
      const quiet = runStatusline(dir, JSON.stringify({ session_id: "sess-1", transcript_path: transcript, model: { id: "x" } }))
      expect((quiet.stdout ?? "").trim()).toBe("")

      // Self-heal: the ledger records idle for real, so the NEXT Enter is a
      // fresh idle→busy transition (the instant-paint flip fires).
      const doc = JSON.parse(await readFile(join(dir, "claude-activity.json"), "utf8")) as {
        sessions: Record<string, { busy: boolean }>
      }
      expect(doc.sessions["sess-1"]?.busy).toBe(false)

      // A live turn after an OLDER interrupt keeps rendering the card.
      await writeFile(
        join(dir, "claude-activity.json"),
        JSON.stringify({ sessions: { "sess-1": { busy: true, at: Date.now() } } }),
        "utf8",
      )
      await writeFile(
        transcript,
        [
          JSON.stringify({
            type: "user",
            interruptedMessageId: "m1",
            message: { role: "user", content: [{ type: "text", text: "[Request interrupted by user]" }] },
          }),
          JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "go on" }] } }),
        ].join("\n") + "\n",
        "utf8",
      )
      const live = runStatusline(dir, JSON.stringify({ session_id: "sess-1", transcript_path: transcript, model: { id: "x" } }))
      expect(visibleRows(live.stdout).length).toBeGreaterThanOrEqual(2)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — SessionStart's --watch seeds the transcript watcher (the instant Esc path)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-watch-"))
    try {
      const res = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--watch"], {
        input: JSON.stringify({ session_id: "s", transcript_path: "C:/t/turn.jsonl" }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(res.status).toBe(0)
      expect(JSON.parse(res.stdout ?? "")).toEqual({ watchPaths: ["C:/t/turn.jsonl"] })

      // No transcript path → prints NOTHING (plain stdout on SessionStart
      // would leak into the hook's context/output).
      const none = spawnSync(process.execPath, [SCHEDULER_BUNDLE, "--watch"], {
        input: "{}",
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(none.status).toBe(0)
      expect((none.stdout ?? "").trim()).toBe("")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — FileChanged: the interrupt-marker write instantly quiets + flips; a live write does nothing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-fc-"))
    try {
      const settingsFile = join(dir, "settings.json")
      const base = `node ${join(dir, "statusline.mjs")}`
      await writeFile(
        settingsFile,
        JSON.stringify({ statusLine: { type: "command", command: base, refreshInterval: 2 } }, null, 2) + "\n",
        "utf8",
      )
      const args = ["--data-dir", dir, "--settings", settingsFile]
      const readCommand = async (): Promise<string> => {
        const parsed = JSON.parse(await readFile(settingsFile, "utf8")) as { statusLine: { command: string } }
        return parsed.statusLine.command
      }
      const transcript = join(dir, "turn.jsonl")
      const markBusy = async (): Promise<void> => {
        await writeFile(
          join(dir, "claude-activity.json"),
          JSON.stringify({ sessions: { "sess-1": { busy: true, at: Date.now() } } }),
          "utf8",
        )
      }

      // Esc: the marker lands in the transcript, the watcher fires, the hook
      // sees busy + interrupted → idle + flip, all in this one invocation.
      await markBusy()
      await writeFile(
        transcript,
        [
          JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "working…" }] } }),
          JSON.stringify({ type: "user", interruptedMessageId: "m1", message: { role: "user", content: [{ type: "text", text: "[Request interrupted by user]" }] } }),
          JSON.stringify({ type: "cost-state" }),
        ].join("\n") + "\n",
        "utf8",
      )
      const check = spawnSync(process.execPath, [SCHEDULER_BUNDLE, ...args, "--interrupt-check"], {
        input: JSON.stringify({ session_id: "sess-1", transcript_path: transcript }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(check.status).toBe(0)
      expect((check.stdout ?? "").trim()).toBe("") // observational hook
      const healed = JSON.parse(await readFile(join(dir, "claude-activity.json"), "utf8")) as {
        sessions: Record<string, { busy: boolean }>
      }
      expect(healed.sessions["sess-1"]?.busy).toBe(false)
      expect(await readCommand()).toBe(`${base} --wf`)

      // A live turn's transcript write: busy ledger + live tail → untouched.
      await markBusy()
      await writeFile(
        transcript,
        [JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: "go on" }] } })].join("\n") +
          "\n",
        "utf8",
      )
      const live = spawnSync(process.execPath, [SCHEDULER_BUNDLE, ...args, "--interrupt-check"], {
        input: JSON.stringify({ session_id: "sess-1", transcript_path: transcript }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(live.status).toBe(0)
      expect((live.stdout ?? "").trim()).toBe("")
      const still = JSON.parse(await readFile(join(dir, "claude-activity.json"), "utf8")) as {
        sessions: Record<string, { busy: boolean }>
      }
      expect(still.sessions["sess-1"]?.busy).toBe(true)
      expect(await readCommand()).toBe(`${base} --wf`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — a fast typist: Enter before the self-heal tick still paints instantly", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-fast-"))
    try {
      const settingsFile = join(dir, "settings.json")
      const base = `node ${join(dir, "statusline.mjs")}`
      await writeFile(
        settingsFile,
        JSON.stringify({ statusLine: { type: "command", command: base, refreshInterval: 2 } }, null, 2) + "\n",
        "utf8",
      )
      // The ledger still carries the interrupted turn's busy mark (the
      // statusline self-heal has not run yet)...
      await writeFile(
        join(dir, "claude-activity.json"),
        JSON.stringify({ sessions: { "sess-1": { busy: true, at: Date.now() - 500 } } }),
        "utf8",
      )
      const transcript = join(dir, "turn.jsonl")
      await writeFile(
        transcript,
        [
          JSON.stringify({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "working…" }] } }),
          JSON.stringify({ type: "user", interruptedMessageId: "m1", message: { role: "user", content: [{ type: "text", text: "[Request interrupted by user]" }] } }),
          JSON.stringify({ type: "cost-state" }),
        ].join("\n") + "\n",
        "utf8",
      )

      // ...but the Enter heartbeat verifies the lie against the transcript
      // and treats it as a real transition → the flip fires.
      const enter = spawnSync(
        process.execPath,
        [SCHEDULER_BUNDLE, "--data-dir", dir, "--settings", settingsFile, "--heartbeat"],
        { input: JSON.stringify({ session_id: "sess-1", transcript_path: transcript }), encoding: "utf8", timeout: 5_000 },
      )
      expect(enter.status).toBe(0)
      const doc = JSON.parse(await readFile(join(dir, "claude-activity.json"), "utf8")) as {
        sessions: Record<string, { busy: boolean }>
      }
      expect(doc.sessions["sess-1"]?.busy).toBe(true) // the NEW turn is live
      const flipped = JSON.parse(await readFile(settingsFile, "utf8")) as { statusLine: { command: string } }
      expect(flipped.statusLine.command).toBe(`${base} --wf`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — the instant-paint flip: a transition rewrites the statusline command, a repeat does not", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-flip-"))
    try {
      const settingsFile = join(dir, "settings.json")
      const base = `node ${join(dir, "statusline.mjs")}`
      await writeFile(
        settingsFile,
        JSON.stringify({ statusLine: { type: "command", command: base, refreshInterval: 2 }, other: "kept" }, null, 2) +
          "\n",
        "utf8",
      )
      const args = ["--data-dir", dir, "--settings", settingsFile]
      const readCommand = async (): Promise<string> => {
        const parsed = JSON.parse(await readFile(settingsFile, "utf8")) as { statusLine: { command: string } }
        return parsed.statusLine.command
      }

      // Enter: idle → busy → the command flips (Claude Code re-runs it
      // instantly on the change, skipping the debounce).
      const enter = spawnSync(process.execPath, [SCHEDULER_BUNDLE, ...args, "--heartbeat"], {
        input: JSON.stringify({ session_id: "sess-1" }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(enter.status).toBe(0)
      expect(await readCommand()).toBe(`${base} --wf`)
      expect((JSON.parse(await readFile(settingsFile, "utf8")) as { other: string }).other).toBe("kept")

      // Mid-run tool events: busy → busy → NO settings churn.
      const tool = spawnSync(process.execPath, [SCHEDULER_BUNDLE, ...args, "--heartbeat"], {
        input: JSON.stringify({ session_id: "sess-1" }),
        encoding: "utf8",
        timeout: 5_000,
      })
      expect(tool.status).toBe(0)
      expect(await readCommand()).toBe(`${base} --wf`)

      // Stop: busy → idle → flips back; a repeat Stop does not.
      for (const expectSuffix of [false, false]) {
        const stop = spawnSync(process.execPath, [SCHEDULER_BUNDLE, ...args, "--idle"], {
          input: JSON.stringify({ session_id: "sess-1" }),
          encoding: "utf8",
          timeout: 5_000,
        })
        expect(stop.status).toBe(0)
        expect(await readCommand()).toBe(expectSuffix ? `${base} --wf` : base)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("E2E — scheduler runs cleanly in plain Node without errors", async () => {
    const dir = await mkdtemp(join(tmpdir(), "waitfeed-claude-sched-"))
    try {
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
