export function HowItWorks() {
  return (
    <section id="how" className="bg-(--bg-secondary) py-14 md:py-20 border-t border-(--rule-default)">
      <div className="mx-auto max-w-300 px-6">
        <h2
          className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) pb-4 mb-8 border-b border-(--rule-default)"
          style={{ fontWeight: 400 }}
        >
          How WaitFeed stays 100% local.
        </h2>

        <ol className="m-0 grid list-none gap-5 p-0 md:grid-cols-3">
          <li className="border border-(--rule-default) bg-(--bg-surface) p-6 relative">
            <span className="font-data text-[12px] tabular-nums text-(--ink-tertiary) border border-(--rule-strong) px-2 py-0.5 rounded-xs">
              01
            </span>
            <h3
              className="mt-4 font-display text-[19px] leading-tight tracking-[-0.02em] text-(--ink-primary)"
              style={{ fontWeight: 400 }}
            >
              Keyless Ingestion
            </h3>
            <p className="mt-2.5 font-body text-[14px] leading-[1.6] text-(--ink-secondary)">
              Fetches public feeds (Hacker News, dev.to, GitHub Trending, Reddit r/programming, and custom RSS)
              on a quiet 30-minute interval. Cached locally in{" "}
              <code className="font-data text-[12px] text-(--ink-primary) bg-(--bg-primary) px-1 py-0.5 border border-(--rule-subtle)">
                ~/.config/waitfeed/cache.json
              </code>
              . No API keys required.
            </p>
          </li>

          <li className="border border-(--rule-default) bg-(--bg-surface) p-6 relative">
            <span className="font-data text-[12px] tabular-nums text-(--ink-tertiary) border border-(--rule-strong) px-2 py-0.5 rounded-xs">
              02
            </span>
            <h3
              className="mt-4 font-display text-[19px] leading-tight tracking-[-0.02em] text-(--ink-primary)"
              style={{ fontWeight: 400 }}
            >
              Zero-Hallucination Digest
            </h3>
            <p className="mt-2.5 font-body text-[14px] leading-[1.6] text-(--ink-secondary)">
              Every story is a strict rewrite of the description we actually fetched — never the model’s memory.
              Two gates keep it honest: too-thin metadata never reaches the model, and when what’s there isn’t enough it
              answers{" "}
              <span className="text-(--accent-color) font-data font-semibold">NEEDS_MORE</span>{" "}
              and the item stays invisible. One glance, under 180 chars, zero web research.
            </p>
          </li>

          <li className="border border-(--rule-default) bg-(--bg-surface) p-6 relative">
            <span className="font-data text-[12px] tabular-nums text-(--ink-tertiary) border border-(--rule-strong) px-2 py-0.5 rounded-xs">
              03
            </span>
            <h3
              className="mt-4 font-display text-[19px] leading-tight tracking-[-0.02em] text-(--ink-primary)"
              style={{ fontWeight: 400 }}
            >
              Observational Vanish
            </h3>
            <p className="mt-2.5 font-body text-[14px] leading-[1.6] text-(--ink-secondary)">
              The card lives in OpenCode’s own prompt slot, drawn by Solid TUI components. It shows only while your
              agent runs — the moment you start typing, the line is yours again. No interception, no buffering, and not
              one keystroke is ever swallowed or delayed.
            </p>
          </li>
        </ol>

        <div className="mt-8 grid gap-x-12 gap-y-3 font-body text-[14px] leading-[1.6] text-(--ink-secondary) md:grid-cols-2 pt-2">
          <p className="max-w-[52ch]">
            <strong className="text-(--ink-primary)">Strict display contract:</strong> While the story layer is healthy,
            only items with verified digests appear. When unavailable, WaitFeed automatically shifts to headline mode.
            The two looks are never mixed.
          </p>
          <p className="max-w-[52ch]">
            <span className="text-(--status-positive) font-semibold">● Live</span> in OpenCode today.
            Zero cloud backend, zero telemetry, zero accounts. Configure channels at runtime with keys{" "}
            <code className="font-data text-[12px] text-(--ink-primary) bg-(--bg-primary) px-1 py-0.5 border border-(--rule-subtle)">1-4</code>{" "}
            in the <code className="font-data text-[12px] text-(--ink-primary) bg-(--bg-primary) px-1 py-0.5 border border-(--rule-subtle)">/news</code> reader.
          </p>
        </div>
      </div>
    </section>
  );
}
