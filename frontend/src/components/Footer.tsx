import { WF_VERSION } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-(--bg-primary) border-t border-(--rule-default)">
      <div className="mx-auto max-w-300 px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] mb-10">
          <div className="max-w-[30ch]">
            <span className="font-data font-bold uppercase tracking-[0.06em] text-(--ink-primary) select-none text-[14px]">
              wait<span className="text-(--accent-color) mx-[0.15em]">·</span>feed
            </span>
            <p className="font-body text-[13px] leading-normal text-(--ink-secondary) mt-3 mb-5">
              The ambient developer news ticker for OpenCode. 100% local, zero ads, zero accounts, zero cloud.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/faizjamadar18/waitfeed"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-(--rule-default) bg-(--bg-surface) text-(--ink-secondary) transition-colors hover:border-(--rule-strong) hover:bg-(--bg-surface-hover) hover:text-(--ink-primary) no-underline"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.479 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="https://opencode.ai"
                target="_blank"
                rel="noreferrer"
                aria-label="OpenCode Website"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-(--rule-default) bg-(--bg-surface) text-(--ink-secondary) transition-colors hover:border-(--rule-strong) hover:bg-(--bg-surface-hover) hover:text-(--ink-primary) no-underline font-data text-[10px] font-bold"
              >
                OC
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-data text-[10px] uppercase tracking-widest text-(--ink-tertiary) mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 m-0 p-0 list-none">
              <li>
                <a
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="#why"
                >
                  Why
                </a>
              </li>
              <li>
                <a
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="#how"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="#channels"
                >
                  Channels
                </a>
              </li>
              <li>
                <a
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="#install"
                >
                  Installation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-data text-[10px] uppercase tracking-widest text-(--ink-tertiary) mb-3">
              Channels
            </h4>
            <ul className="space-y-2 m-0 p-0 list-none">
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://news.ycombinator.com"
                >
                  Hacker News
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://dev.to"
                >
                  dev.to
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://github.com/trending"
                >
                  GitHub Trending
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://reddit.com/r/programming"
                >
                  r/programming
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-data text-[10px] uppercase tracking-widest text-(--ink-tertiary) mb-3">
              Ecosystem
            </h4>
            <ul className="space-y-2 m-0 p-0 list-none">
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://opencode.ai/v2/docs/build/plugins"
                >
                  OpenCode Plugin Docs
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://www.npmjs.com/package/waitfeed"
                >
                  npm Package Registry
                </a>
              </li>
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[13px] text-(--ink-secondary) hover:text-(--ink-primary) no-underline transition-colors"
                  href="https://github.com/faizjamadar18/waitfeed/blob/main/LICENSE"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-(--rule-default) flex justify-between items-center flex-wrap gap-3 font-data text-[11px] text-(--ink-tertiary)">
          <span className="flex items-center gap-1.5 text-[13px] text-(--ink-secondary)">
            built with
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" className="inline-block text-(--accent-color)" role="img" aria-label="love">
              <rect x="1" y="0" width="2" height="1"></rect>
              <rect x="6" y="0" width="2" height="1"></rect>
              <rect x="0" y="1" width="4" height="1"></rect>
              <rect x="5" y="1" width="4" height="1"></rect>
              <rect x="0" y="2" width="9" height="1"></rect>
              <rect x="0" y="3" width="9" height="1"></rect>
              <rect x="1" y="4" width="7" height="1"></rect>
              <rect x="2" y="5" width="5" height="1"></rect>
              <rect x="3" y="6" width="3" height="1"></rect>
              <rect x="4" y="7" width="1" height="1"></rect>
            </svg>
            for the terminal
          </span>
          <div className="flex items-center gap-3">
            <span>v{WF_VERSION}</span>
            <span>·</span>
            <span>MIT</span>
            <span>·</span>
            <span>2026</span>
            <span className="border border-(--rule-strong) px-2 py-0.5 text-[10px] text-(--ink-secondary)">
              Dark Mode
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
