import { describe, expect, it, vi } from "vitest"
import { emptyReaderState, groupItems, itemKey, markItem } from "../packages/waitfeed/core/reader-state"
import type { FeedItem } from "../packages/waitfeed/core/types"

type Hook = (api: unknown, event: unknown, next: (event: unknown) => unknown) => Promise<unknown>
type Node = { kind: string; props: Record<string, unknown> }

/** Exercise the shipped register entry point, replacing only the host boundary.
 * No source extraction, private-function exports or real user files. */
async function reader(items: FeedItem[], ledger = emptyReaderState()) {
  vi.resetModules()
  const { register } = await import("../packages/waitfeed/claude-mod/hooks/register.js")
  const handlers = new Map<string, Hook>()
  register((event: string, matcherOrHook: Record<string, string> | Hook, hook?: Hook) => {
    const matcher = typeof matcherOrHook === "function" ? {} : matcherOrHook
    const handler = typeof matcherOrHook === "function" ? matcherOrHook : hook!
    handlers.set(event + (matcher.component ?? ""), handler)
    return { catch() {} }
  })
  const root = "/fixture-home/.config/waitfeed"
  const files = new Map([
    [root + "/cache.json", JSON.stringify({ items })],
    [root + "/reader-state.json", JSON.stringify(ledger)],
  ])
  const component = (kind: string) => (props: Record<string, unknown>): Node => ({ kind, props })
  const api = {
    env: { get: async (name: string) => name === "HOME" ? "/fixture-home" : "" },
    fs: {
      read: async (path: string) => files.get(path) ?? "",
      write: async (path: string, value: string) => { files.set(path, value) },
    },
    command: { register: async () => {} },
    clock: { every() {} },
    process: { run: async () => {} },
    ui: {
      resolve: () => ({ Box: component("Box"), Text: component("Text"), Button: component("Button") }),
      invalidate() {},
      toast: async () => {},
    },
  }
  await handlers.get("session.start")!(api, {}, () => ({}))
  return {
    async draw() {
      const tree = await handlers.get("ui.renderPane")!(api, { requestId: "waitfeed" }, () => ({})) as Node
      return tree.props.children as Node[]
    },
    ledger: () => JSON.parse(files.get(root + "/reader-state.json")!),
  }
}

const article = (url: string, title: string): FeedItem => ({ id: title, source: "RSS", title, url })

describe("Claude reader shares URL identity with the core", () => {
  it.each([
    ["https://example.com/Article", "https://example.com/article"],
    ["https://example.com/?id=AbC", "https://example.com/?id=abc"],
  ])("respects a core read mark without hiding %s's distinct neighbor", async (firstURL, secondURL) => {
    const first = article(firstURL, "First")
    const second = article(secondURL, "Second")
    const state = markItem(emptyReaderState(), "read", itemKey(first))
    const pane = await reader([first, second], state)
    const rows = await pane.draw()
    const buttons = rows.filter((row) => row.kind === "Button")
    expect(buttons.map((row) => row.props.key)).toEqual(["up-0", "sn-0"])
  })

  it("opening one article writes a mark the core and the pane both keep separate", async () => {
    const first = article("HTTPS://EXAMPLE.com/Article?id=AbC", "First")
    const second = article("https://example.com/article?id=abc", "Second")
    const pane = await reader([first, second])
    const button = (await pane.draw()).find((row) => row.kind === "Button")!
    await (button.props.onPress as () => Promise<void>)()
    expect(groupItems([first, second], pane.ledger()).upcoming).toEqual([second])
    const buttons = (await pane.draw()).filter((row) => row.kind === "Button")
    expect(buttons.map((row) => row.props.key)).toEqual(["up-0", "sn-0"])
  })
})
