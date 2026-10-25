// Package-integrity tests — the guard against the "works in dev, breaks on a
// consumer machine" bug class. Every rule here exists because a real consumer
// install (waitfeed@1.0.0) failed exactly this way: the TUI entry had no JSX
// source declaration, OpenCode's transpiler fell back to React, and the plugin
// crashed importing a package this project never uses.
//
// These tests read the shipped package the way a consumer would receive it:
// the bare files, with no repo tsconfig above them, and assert the package is
// self-describing.
import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"
import { join, sep } from "node:path"

const PKG = join(import.meta.dirname, "..", ".opencode", "plugins", "waitfeed")

/** The JSX source declaration that MUST be the first line of the TUI entry. */
const JSX_PRAGMA = "/* @jsxImportSource @opentui/solid */"

/** Every .ts/.tsx file the package ships, found dynamically (so a new core
 * module is covered automatically). node_modules is excluded — in the dev
 * tree it exists; in a published package it never does. */
async function shippedCodeFiles(): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string): Promise<void> {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
    }
  }
  await walk(PKG)
  return out
}

/** Import statements only — a bare word like "reactions" must not trip this. */
const REACT_IMPORT = /(?:from|import|require)\s*\(?\s*["']react(?:\/|\b|"|')/i

/** Anything that ties the code to one developer's machine or one folder:
 * hardcoded absolute homes, cwd-dependent reads, or CommonJS path globals. */
const CONTEXT_DEPENDENT = /__dirname|process\.cwd\(|C:\\\\Users|C:\\Users|\/home\/|\/Users\//

describe("package integrity (consumer-machine safety)", () => {
  it("tui.tsx declares its JSX source as the very first line", async () => {
    const content = await readFile(join(PKG, "tui.tsx"), "utf8")
    const firstLine = content.split(/\r?\n/, 1)[0]
    expect(firstLine).toBe(JSX_PRAGMA)
  })

  it("a shipped tsconfig.json declares the same JSX source", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8"))
    expect(pkg.files).toContain("tsconfig.json")
    const tsconfig = JSON.parse(await readFile(join(PKG, "tsconfig.json"), "utf8"))
    const declared = tsconfig.compilerOptions?.jsxImportSource
    expect(declared).toBe("@opentui/solid")
    // Pragma and tsconfig must agree — two mechanisms, one truth.
    expect(JSX_PRAGMA).toBe(`/* @jsxImportSource ${declared} */`)
  })

  it("no shipped file imports React — in any form", async () => {
    for (const file of await shippedCodeFiles()) {
      const content = await readFile(file, "utf8")
      expect(content, `${file} imports react`).not.toMatch(REACT_IMPORT)
    }
  })

  it("no shipped file depends on machine context (paths, cwd, dir globals)", async () => {
    for (const file of await shippedCodeFiles()) {
      const content = await readFile(file, "utf8")
      expect(content, `${file} has context-dependent code`).not.toMatch(CONTEXT_DEPENDENT)
    }
  })

  it("every file access is anchored to the user's home directory", async () => {
    // The only sane anchor in a consumer install: join(homedir(), ".config", "waitfeed", ...).
    // Assert the anchor exists where file paths are built, so a future edit
    // can't quietly switch to a cwd-relative path that only works in this repo.
    const index = await readFile(join(PKG, "index.ts"), "utf8")
    const tui = await readFile(join(PKG, "tui.tsx"), "utf8")
    const config = await readFile(join(PKG, "core", "config.ts"), "utf8")
    for (const [name, content] of [["index.ts", index], ["tui.tsx", tui], ["config.ts", config]] as const) {
      expect(content, `${name} lost its homedir anchor`).toMatch(/join\(\s*homedir\(\)/)
    }
  })

  it("package.json exports, bin, and files all exist on disk", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8"))
    for (const [key, target] of Object.entries(pkg.exports as Record<string, string>)) {
      expect(key).toMatch(/^\.$|^\.\/tui$/)
      await expect(readFile(join(PKG, target), "utf8"), `export target missing: ${key}`).resolves.toBeTruthy()
    }
    expect(pkg.bin).toBeDefined()
    expect(pkg.bin.waitfeed).toBe("./bin.mjs")
    const binContent = await readFile(join(PKG, pkg.bin.waitfeed), "utf8")
    expect(binContent.startsWith("#!/usr/bin/env node")).toBe(true)
    for (const listed of pkg.files as string[]) {
      if (listed.endsWith("/")) {
        const entries = await readdir(join(PKG, listed.slice(0, -1)))
        expect(entries.length, `files dir empty: ${listed}`).toBeGreaterThan(0)
      } else {
        await expect(readFile(join(PKG, listed), "utf8"), `files entry missing: ${listed}`).resolves.toBeTruthy()
      }
    }
  })
})

describe("ticker card layout (field-bug guard from 1.0.1, narrow terminal)", () => {
  it("the slot card sizes nothing from the global terminal width", async () => {
    const src = await readFile(join(PKG, "tui.tsx"), "utf8")
    const start = src.indexOf("const NewsParagraph")
    const end = src.indexOf("const ReaderRow")
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    const card = src.slice(start, end)
    // Root cause of the vanished badge/score/age in the field: the card sized
    // itself from process.stdout.columns, but the composer slot is narrower
    // than the terminal — the oversize row overflowed and clipped. The card
    // must use fixed compact pieces and the box's own width instead.
    expect(card, "NewsParagraph must not size from columns()").not.toContain("columns()")
  })
})

describe("AGY plugin bundle packaging (Antigravity CLI port)", () => {
  it("the published package ships the agy/ directory", async () => {
    const pkg = JSON.parse(await readFile(join(PKG, "package.json"), "utf8")) as { files: string[] }
    expect(pkg.files).toContain("agy/")
  })

  it("every AGY source file obeys the consumer-machine safety rules too", async () => {
    for (const file of await shippedCodeFiles()) {
      if (!file.includes(`${sep}agy${sep}src${sep}`)) continue
      const content = await readFile(file, "utf8")
      expect(content, `${file} has context-dependent code`).not.toMatch(CONTEXT_DEPENDENT)
      expect(content, `${file} imports react`).not.toMatch(REACT_IMPORT)
      // And every file access anchors to the user's home directory.
      expect(content, `${file} lost its homedir anchor`).toMatch(/homedir\(\)/)
    }
  })
})
