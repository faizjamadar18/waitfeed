// Claude Code mod contract tests — pins the shipped /news pane to the mods
// syntax of the docs fetched 2026-10-29 (code.claude.com/docs/en/plugins/mods):
// event names as string literals, `$` calls written in full, no imports at all
// (a hooks module has no Node.js APIs — file/env/process access goes through
// the mods API), the shared cache + ledger reads, and the observational
// gating ("only while the agent executes").
import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const MOD = join(import.meta.dirname, "..", "packages", "waitfeed", "claude-mod")
const registerSrc = async () => readFile(join(MOD, "hooks", "register.js"), "utf8")

describe("the mod is a well-formed plugin dir", () => {
  it("the manifest names it waitfeed — never a claude- prefix (validate fails on those)", async () => {
    const manifest = JSON.parse(await readFile(join(MOD, ".claude-plugin", "plugin.json"), "utf8")) as {
      name: string
      version: string
      description: string
      author?: { name: string }
    }
    expect(manifest.name).toBe("waitfeed")
    expect(manifest.name, "claude plugin validate fails a name that starts with claude-").not.toMatch(/^claude-/)
    expect(manifest.version, "a version string is required").toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifest.description.length).toBeGreaterThan(0)
    expect(manifest.author?.name.length ?? 0).toBeGreaterThan(0)
  })

  it("hooks.json points at ./register.js — the modules key is what makes a plugin a mod", async () => {
    const hooks = JSON.parse(await readFile(join(MOD, "hooks", "hooks.json"), "utf8")) as { modules?: string[] }
    expect(hooks.modules).toEqual(["./register.js"])
  })

  it("the package ships the mod dir and its README states the version gate", async () => {
    const pkg = JSON.parse(await readFile(join(import.meta.dirname, "..", "packages", "waitfeed", "package.json"), "utf8")) as {
      files: string[]
    }
    expect(pkg.files).toContain("claude-mod/")
    const readme = await readFile(join(MOD, "README.md"), "utf8")
    expect(readme, "button-row lists need the children API").toContain("2.1.295")
  })
})

describe("register.js obeys the static-analysis rules", () => {
  it("exports register(on) — the one parameter, never shadowed", async () => {
    const src = await registerSrc()
    expect(src).toContain("export function register(on)")
    expect(src, "no second `on` inside register — validation fails with: shadowed").not.toMatch(
      /register\s*\(\s*on\s*,|function register\(on[\s\S]*\|\s*on\s*\|/,
    )
  })

  it("every event name is a string literal, with the exact matchers", async () => {
    const src = await registerSrc()
    expect(src).toContain("on('session.start'")
    expect(src).toContain("on('command.run', { command: 'news' }")
    expect(src).toContain("on('ui.render', { component: 'AbovePrompt' }")
    expect(src).toContain("on('ui.render', { component: 'Pane' }")
    // no computed event names — the scan only reads literals
    expect(src, "no on( into a variable").not.toMatch(/\bon\s*\(\s*[a-zA-Z$_][\w$]*\s*[,)]/)
  })

  it("every mods API call is written in full — no namespaced aliases of $", async () => {
    const src = await registerSrc()
    for (const call of [
      "$.command.register({",
      "$.ui.open({ id: PANE",
      "$.ui.resolve(e)",
      "$.ui.invalidate('ui.render')",
      "$.fs.read(",
      "$.fs.write(",
      "$.env.get(",
      "$.process.run([",
      "$.clock.every(TICKER_DWELL_MS",
    ]) {
      expect(src, `missing the full call: ${call}`).toContain(call)
    }
    expect(src, "$.ui is used as a value — validation fails").not.toMatch(
      /const\s+(?:ui|fs|env|clock|command|process)\s*=\s*\$/,
    )
  })

  it("no imports at all — no node:, no dynamic import(), no require", async () => {
    const src = await registerSrc()
    expect(src, "a hooks module imports its own files with an import declaration only, and needs nothing here").not.toMatch(
      /(^|\n)\s*import\b/,
    )
    expect(src).not.toMatch(/from\s+["']node:/)
    expect(src).not.toMatch(/\bimport\s*\(/)
    expect(src).not.toMatch(/\brequire\s*\(/)
  })
})

describe("the /news command opens the reader pane", () => {
  it("immediate + the open shape from the interface docs", async () => {
    const src = await registerSrc()
    expect(src).toContain("name: 'news',")
    expect(src, "let /news open the pane while Claude is working").toContain("immediate: true,")
    expect(src).toContain("$.ui.open({ id: PANE, title: 'WaitFeed — news', focus: true, closeOnEscape: true })")
    expect(src, "opening a pane prints nothing in the transcript").toContain("return {}")
  })
})

describe("the band: the rotating ticker card, gated on execution", () => {
  it("quiet when idle — next(e) — the no-fetched-surface rule", async () => {
    const src = await registerSrc()
    expect(src).toContain("if (!e.props.isWorking) return next(e)")
    expect(src).toContain("if (cacheItems.length === 0) return next(e)")
  })
  it("rotates on the shared wall-clock dwell, redrawing via invalidate", async () => {
    const src = await registerSrc()
    expect(src).toContain("const TICKER_DWELL_MS = 20_000")
    expect(src).toContain("const redraw = () => $.ui.invalidate('ui.render')")
  })
})

describe("shared data — the same rule as every host", () => {
  it("renders only read ~/.config/waitfeed/: the cache and the reader ledger", async () => {
    const src = await registerSrc()
    expect(src).toContain("'/.config/waitfeed'")
    expect(src).toContain("+ '/cache.json'")
    expect(src).toContain("+ '/reader-state.json'")
  })
  it("the ledger keys match the other hosts: url|id, trimmed lowercased", async () => {
    const src = await registerSrc()
    expect(src).toContain("it.url || it.id")
    expect(src).toContain(".trim().toLowerCase()")
    expect(src, "the only auto label kept is your own read time").toContain("'read ' + agoOf(")
  })
  it("marks read and re-reads the ledger right before writing", async () => {
    const src = await registerSrc()
    expect(src).toContain("async function markRead(")
    expect(src).toContain("async function openLink(")
    expect(src).toContain("await $.ui.toast(")
  })
})

describe("the pane rows are pressable buttons — the docs' row-of-a-list pattern", () => {
  it("one button per headline, description under it, section headers", async () => {
    const src = await registerSrc()
    expect(src).toContain("Button({")
    expect(src).toContain("onPress: async () => {")
    expect(src).toContain("key: tag + '-' + i,")
    expect(src).toContain("'UPCOMING — new to you ('")
    expect(src).toContain("'SEEN — already brought to you ('")
  })
  it("pressing a row opens the link without a shell (argument list)", async () => {
    const src = await registerSrc()
    expect(src).toContain("['rundll32', 'url.dll,FileProtocolHandler', url]")
    expect(src).toContain("['cmd', '/c', 'start', '', url]")
    expect(src).toContain("['open', url]")
    expect(src).toContain("['xdg-open', url]")
    // rundll32 first on Windows — one program, args verbatim; `start` wants
    // an empty console title that the arg-list run has been seen to mangle.
    expect(src.indexOf("['rundll32'")).toBeLessThan(src.indexOf("['cmd', '/c', 'start'"))
  })

  it("the pane leads with a hint line and opens on the first upcoming row", async () => {
    const src = await registerSrc()
    expect(src).toContain("↑/↓ move · Enter open · Esc close")
    // the hint is the pane's FIRST child — above the counts header
    expect(src.indexOf("↑/↓ move")).toBeLessThan(src.indexOf("WaitFeed — seen "))
    // the docs' focus prop: accepts only true, set nowhere else
    expect(src).toContain("...(focusRow && i === 0 ? { autoFocus: true } : {}),")
    expect(src.match(/autoFocus: true/g) ?? []).toHaveLength(1)
    expect(src).toContain("rows(groups.upcoming, 'up', true)")
    expect(src).toContain("rows(groups.seen, 'sn')")
  })
})

describe("the pane walks with the arrows — the sticky-cursor list (d.ts 2.1.277)", () => {
  it("one line per headline: the description leaves the pane tree (it stays in the cache)", async () => {
    const src = await registerSrc()
    expect(src).not.toContain("out.push(Text({ children: ['  ' + it.context]")
  })

  it("both piles draw from a bigger cap — every row must be reachable by the cursor", async () => {
    const src = await registerSrc()
    expect(src).toContain("const PANE_MAX_ROWS = 100")
  })

  it("the mod owns the pane's keyboard window: ui.scroll + ui.focus hooks with the pane matcher", async () => {
    const src = await registerSrc()
    expect(src).toContain("on('ui.scroll', { requestId: 'waitfeed' }")
    expect(src).toContain("on('ui.focus', { requestId: 'waitfeed' }")
  })

  it("the ring is tracked: opened on up-0, then wherever ui.focus says", async () => {
    const src = await registerSrc()
    expect(src).toContain("let ringKey = 'up-0'")
    expect(src).toContain("ringKey = e.element")
    expect(src).toContain("ringKey = key")
  })

  it("arrows and wheel steps are translated to ring moves, never to content scroll", async () => {
    const src = await registerSrc()
    // other mods' events and our OWN moves ride next() — the loop breaker
    expect(src).toContain("if (e.origin.kind === 'plugin') return next(e)")
    // page keys keep their docs job: scroll the window
    expect(src).toContain("Math.abs(e.by) > 1")
    // the wheel is a distinct origin: one step, the sign only
    expect(src).toContain("e.pointer")
    const src2 = src
    // a row step lands the ring on the neighbor button
    expect(src2).toContain("await $.ui.focus({ requestId: PANE, key: key })")
    // the sticky-cursor slide: reveal the ring least-wise, nearest
    expect(src2).toContain("await $.ui.scroll({ to: { key: key }, block: 'nearest' })")
    // consumed arrows answer {} WITHOUT next — the host window stays put
    expect(src2).toContain("if (!key) return {}")
  })

  it("a denied steer must not eat the user's scroll (fail soft)", async () => {
    const src = await registerSrc()
    expect(src).toContain("if (move && move.deny) return next(e)")
  })

  it("a thrown hook row falls back to next(e) — both gating hooks carry .catch", async () => {
    const src = await registerSrc()
    expect(src.match(/\}\)\.catch\(async \(\$, e, next\) => next\(e\)\)/g) ?? []).toHaveLength(2)
  })
})
