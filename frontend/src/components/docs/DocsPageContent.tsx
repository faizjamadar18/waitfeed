"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  AGENT_GUIDES,
  BEGINNER_FAQS,
  BUILTIN_CHANNELS,
  CLI_COMMANDS,
  CONFIG_OPTIONS,
  LOCAL_FILES_EXPLAINED,
} from "@/data/docsData";
import { DocsCard, DocsCardGrid } from "./DocsCards";
import { DocsCliTabs, DocsCodeBlock } from "./DocsCodeBlock";
import { DocsCallout } from "./DocsCallout";

const DRAWER_EASE = [0.22, 1, 0.36, 1] as const;

interface DocsPageContentProps {
  onSelectSection: (id: string) => void;
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-neutral-800/80 bg-neutral-900/70 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-200">
      {children}
    </code>
  );
}

/** Renders `backticked` spans as inline code inside otherwise plain copy. */
function TextWithCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <InlineCode key={index}>{part.slice(1, -1)}</InlineCode>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function ChannelIcon({ badge }: { badge: string }) {
  const className = "h-5.5 w-5.5 fill-current";

  switch (badge) {
    case "HN":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896h-1.88z" />
        </svg>
      );
    case "DEV":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 fill-white"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
        </svg>
      );
    case "GH":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case "REDDIT":
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z" />
        </svg>
      );
    default:
      return null;
  }
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="pb-1">
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-400">
        {description}
      </p>
    </div>
  );
}

function Facts({
  rows,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/40">
      <dl className="divide-y divide-neutral-800/60">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[128px_1fr] sm:gap-4"
          >
            <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 sm:pt-0.5">
              {row.label}
            </dt>
            <dd className="text-sm leading-6 text-neutral-200">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Notes({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-neutral-300">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-neutral-500"
          />
          <span>
            <TextWithCode text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function DocsTable({
  head,
  rows,
  monoFirst = false,
}: {
  head: string[];
  rows: Array<{ key: string; cells: ReactNode[] }>;
  monoFirst?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-950/40">
      <table className="w-full min-w-140 text-left text-sm">
        <thead className="border-b border-neutral-800/80 bg-neutral-900/30">
          <tr>
            {head.map((label) => (
              <th
                key={label}
                className="px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-neutral-400"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={index} className="px-4 py-3 align-top">
                  {index === 0 && monoFirst ? (
                    <span className="font-mono text-xs text-neutral-100">
                      {cell}
                    </span>
                  ) : (
                    <div className="text-sm leading-6 text-neutral-300">
                      {cell}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/70 font-mono text-xs font-medium text-neutral-400">
        {number}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="text-sm font-semibold text-white sm:text-base">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function AgentSetupDrawer({
  setup,
}: {
  setup: {
    label: string;
    code: string;
    filename?: string;
    language?: string;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/40">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between cursor-pointer px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors"
      >
        <span>{setup.label}</span>
        <motion.svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-neutral-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: DRAWER_EASE }
          }
        >
          <path d="m4 6 4 4 4-4" />
        </motion.svg>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
              height: {
                duration: isOpen ? 0.45 : 0.3,
                ease: DRAWER_EASE,
              },
              opacity: {
                duration: isOpen ? 0.35 : 0.2,
                delay: isOpen ? 0.05 : 0,
                ease: "easeInOut",
              },
            }
        }
        className="overflow-hidden"
      >
        <div className="border-t border-neutral-800/70 px-4 pb-1 pt-3">
          <DocsCodeBlock
            code={setup.code}
            filename={setup.filename}
            language={setup.language}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function DocsPageContent({ onSelectSection }: DocsPageContentProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-16 px-4 py-10 text-neutral-200 sm:px-8 sm:py-14">
      {/* Overview */}
      <section id="overview" className="scroll-mt-24 space-y-7">
        <div className="space-y-4">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Documentation
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            A quiet tech feed for your coding agents.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-neutral-400 sm:text-lg">
            WaitFeed shows a rotating tech-news card while Claude Code,
            OpenCode, or Antigravity works. It disappears at idle. No LLM calls,
            API keys, or server.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            <span>3 hosts</span>
            <span className="text-neutral-700">/</span>
            <span>4 channels</span>
            <span className="text-neutral-700">/</span>
            <span>0 tokens</span>
          </div>
        </div>

        <div>
          <div className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Install
          </div>
          <DocsCliTabs command="waitfeed init" />
        </div>

        <DocsCardGrid columns={3}>
          <DocsCard
            title="Quickstart"
            description="Install, pick your hosts, and see the first card."
            href="#quickstart"
            onClick={() => onSelectSection("quickstart")}
            meta="~2 minutes"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 4 4 4-4 4" />
                <path d="M9 12h4" />
              </svg>
            }
          />
          <DocsCard
            title="How it works"
            description="One local cache, one refresh cycle, no model in the loop."
            href="#architecture"
            onClick={() => onSelectSection("architecture")}
            meta="Shared by every host"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2 2 5l6 3 6-3-6-3Z" />
                <path d="m2 8 6 3 6-3" />
                <path d="m2 11 6 3 6-3" />
              </svg>
            }
          />
          <DocsCard
            title="Configuration"
            description="Every key in config.json, with defaults and fallbacks."
            href="#config-schema"
            onClick={() => onSelectSection("config-schema")}
            meta="~/.config/waitfeed/"
            icon={
              <svg
                viewBox="0 0 16 16"
                className="h-4 w-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2H4.5A1.5 1.5 0 0 0 3 3.5v3L1.5 8 3 9.5v3A1.5 1.5 0 0 0 4.5 14H6" />
                <path d="M10 2h1.5A1.5 1.5 0 0 1 13 3.5v3L14.5 8 13 9.5v3a1.5 1.5 0 0 1-1.5 1.5H10" />
              </svg>
            }
          />
        </DocsCardGrid>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="scroll-mt-24 space-y-6">
        <SectionHeading
          title="Quickstart"
          description="One command wires every supported host. Start an agent, then read while it works."
        />

        <div className="space-y-7">
          <Step number={1} title="Run the setup wizard">
            <p className="text-sm leading-6 text-neutral-300">
              WaitFeed detects installed hosts, lets you choose agents and
              channels, stages each integration, and writes the shared config.
              Re-running is safe.
            </p>
            <DocsCodeBlock code="npx waitfeed init" language="bash" />
          </Step>

          <Step number={2} title="Start an agent">
            <p className="text-sm leading-6 text-neutral-300">
              Open Claude Code, OpenCode, or <InlineCode>agy</InlineCode> and
              give it a task. WaitFeed stays hidden until the agent starts
              working.
            </p>
          </Step>

          <Step number={3} title="Read while it works">
            <p className="text-sm leading-6 text-neutral-300">
              The card rotates above the prompt or in the statusline. Open{" "}
              <InlineCode>/feed</InlineCode> for the reader; press{" "}
              <InlineCode>Ctrl+N</InlineCode> in Claude Code or{" "}
              <InlineCode>Ctrl+O</InlineCode> in OpenCode to hide the card.
            </p>
          </Step>
        </div>

        <DocsCallout type="tip" title="First fetch">
          A fresh install can stay empty for a few seconds while the first
          fetch cycle lands.
        </DocsCallout>
      </section>

      {/* How it works */}
      <section id="architecture" className="scroll-mt-24 space-y-6">
        <SectionHeading
          title="How it works"
          description="The pipeline is shared. Renderers only read the cache, and each host decides when the card is visible."
        />

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3 sm:p-4">
          <div className="grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/80 sm:grid-cols-4">
            {[
              { step: "01", label: "Sources", detail: "4 built-ins + RSS" },
              { step: "02", label: "Fetch cycle", detail: "30-min baseline" },
              { step: "03", label: "Shared cache", detail: "90 items · 36 h" },
              { step: "04", label: "Host gate", detail: "busy → show" },
            ].map((node) => (
              <div
                key={node.label}
                className="py-3 px-4 first:pt-1 last:pb-1 sm:py-2 sm:px-4 text-left"
              >
                <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
                  {node.step}
                </div>
                <div className="mt-1 font-mono text-xs font-medium text-neutral-200">
                  {node.label}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {node.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Refresh
            </h3>
            <p className="text-sm leading-6 text-neutral-300">
              A fresh cache suppresses fetching for 30 minutes. Below 5 unread
              items, the pipeline refills early — at most once a minute.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Retention
            </h3>
            <p className="text-sm leading-6 text-neutral-300">
              Up to 90 items are carried for 36 hours, so a dead source never
              empties the rotation.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              Locking
            </h3>
            <p className="text-sm leading-6 text-neutral-300">
              <InlineCode>cycle.lock</InlineCode> serializes concurrent hosts. A
              lock older than 10 minutes is stolen by the next run.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Visibility modes</h3>
          <DocsTable
            head={["Mode", "Behavior"]}
            rows={[
              {
                key: "auto",
                cells: [
                  <InlineCode key="mode">auto</InlineCode>,
                  <span key="behavior">
                    Shows the card only while the agent works.
                  </span>,
                ],
              },
              {
                key: "hide",
                cells: [
                  <InlineCode key="mode">hide</InlineCode>,
                  <span key="behavior">
                    Keeps the card off, even mid-run.
                  </span>,
                ],
              },
              {
                key: "show",
                cells: [
                  <InlineCode key="mode">show</InlineCode>,
                  <span key="behavior">
                    Legacy alias of <InlineCode>auto</InlineCode>. It cannot
                    pin the card at idle.
                  </span>,
                ],
              },
            ]}
          />
        </div>

        <DocsCallout type="important" title="No LLM in the loop">
          Descriptions come from the feeds themselves. Items with thin
          descriptions are dropped rather than padded, and no prompt, API key,
          or model call is involved.
        </DocsCallout>
      </section>

      {/* Agents */}
      {AGENT_GUIDES.map((agent) => (
        <section
          key={agent.id}
          id={agent.id}
          className="scroll-mt-24 space-y-5"
        >
          <SectionHeading title={agent.name} description={agent.summary} />

          <Facts
            rows={[
              {
                label: "Appears in",
                value: <TextWithCode text={agent.where} />,
              },
              {
                label: "Read more",
                value: <TextWithCode text={agent.readMore} />,
              },
              {
                label: "Toggle",
                value: <TextWithCode text={agent.toggle} />,
              },
              {
                label: "Requires",
                value: <TextWithCode text={agent.requires} />,
              },
            ]}
          />

          <Notes items={agent.notes} />

          {agent.setup && (
            <AgentSetupDrawer setup={agent.setup} />
          )}
        </section>
      ))}

      {/* Channels */}
      <section id="feeds-builtin" className="scroll-mt-24 space-y-6">
        <SectionHeading
          title="Channels"
          description="Four built-in sources, all enabled by default. Each one uses the same card format and shared cache."
        />

        <DocsCardGrid columns={2}>
          {BUILTIN_CHANNELS.map((channel) => (
            <DocsCard
              key={channel.name}
              title={channel.name}
              description={channel.description}
              meta={channel.sourceUrl}
              icon={<ChannelIcon badge={channel.badge} />}
            />
          ))}
        </DocsCardGrid>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Turn channels on or off
          </h3>
          <Notes
            items={[
              "In OpenCode, open `/feed` and choose the Sources row. Selecting a channel saves immediately.",
              "From any host, edit `sources` in `config.json`. A disabled channel is not contacted by the next fetch.",
              "All four are on by default; custom RSS feeds are configured separately.",
            ]}
          />
        </div>

        <DocsCallout type="note" title="RSS is a badge, not a channel">
          Custom feeds always run when configured. There is no fifth built-in
          channel toggle for RSS.
        </DocsCallout>
      </section>

      {/* Custom feeds */}
      <section id="feeds-custom" className="scroll-mt-24 space-y-5">
        <SectionHeading
          title="Custom feeds"
          description="Add RSS or Atom URLs for engineering blogs, newsletters, and release notes."
        />

        <p className="max-w-2xl text-sm leading-6 text-neutral-300">
          Put up to 10 URLs in <InlineCode>rssUrls</InlineCode>. They always run
          and render with the <InlineCode>RSS</InlineCode> badge.
        </p>

        <DocsCodeBlock
          filename="~/.config/waitfeed/config.json"
          language="json"
          code={`{
  "rssUrls": [
    "https://overreacted.io/rss.xml",
    "https://jvns.ca/atom.xml"
  ]
}`}
        />

        <Notes
          items={[
            "The setup wizard accepts one URL; edit `config.json` for the rest.",
            "Both RSS and Atom work. A failing feed is skipped, and cached items keep the rotation full.",
            "Items with thin descriptions are dropped rather than padded.",
          ]}
        />
      </section>

      {/* Configuration */}
      <section id="config-schema" className="scroll-mt-24 space-y-5">
        <SectionHeading
          title="config.json"
          description="One shared file at ~/.config/waitfeed/config.json. Hosts read it; init writes it."
        />

        <DocsCodeBlock
          filename="~/.config/waitfeed/config.json"
          language="json"
          code={`{
  "setupDone": true,
  "sources": {
    "hn": true,
    "devto": true,
    "github": true,
    "reddit": true
  },
  "rssUrls": [],
  "dwellSeconds": 20,
  "newsMode": "auto"
}`}
        />

        <DocsTable
          head={["Key", "Type", "Default", "Notes"]}
          monoFirst
          rows={CONFIG_OPTIONS.map((option) => ({
            key: option.key,
            cells: [
              option.key,
              <span key="type" className="font-mono text-xs text-neutral-400">
                {option.type}
              </span>,
              <span key="default" className="font-mono text-xs text-neutral-300">
                {option.defaultValue}
              </span>,
              <TextWithCode key="description" text={option.description} />,
            ],
          }))}
        />

        <DocsCallout type="note" title="Safe to hand-edit">
          Unknown keys and invalid values fall back to defaults. A half-written
          file cannot break the ticker.
        </DocsCallout>
      </section>

      {/* Local data */}
      <section id="config-storage" className="scroll-mt-24 space-y-5">
        <SectionHeading
          title="Local data"
          description="Everything lives in ~/.config/waitfeed/. Nothing is sent anywhere."
        />

        <DocsTable
          head={["File", "Role", "Holds", "Lifetime"]}
          monoFirst
          rows={LOCAL_FILES_EXPLAINED.map((file) => ({
            key: file.path,
            cells: [
              file.path,
              file.role,
              <TextWithCode key="detail" text={file.detail} />,
              file.retention,
            ],
          }))}
        />

        <Notes
          items={[
            "The cache and reader history are shared by every host on the machine.",
            "The only network calls are to the feed URLs you keep enabled.",
            "`npx waitfeed remove` deletes this folder; `--keep-data` leaves it in place.",
          ]}
        />
      </section>

      {/* CLI */}
      <section id="cli-init" className="scroll-mt-24 space-y-5">
        <SectionHeading
          title="CLI"
          description="Run commands with npx, or install the package globally. The same switches work from any shell."
        />

        <DocsTable
          head={["Command", "What it does"]}
          monoFirst
          rows={CLI_COMMANDS.map((command) => ({
            key: command.command,
            cells: [
              command.command,
              <div key="description">
                <TextWithCode text={command.summary} />
                {command.note && (
                  <div className="mt-1 text-xs text-neutral-500">
                    <TextWithCode text={command.note} />
                  </div>
                )}
              </div>,
            ],
          }))}
        />

        <p className="text-sm leading-6 text-neutral-400">
          Host is one of <InlineCode>opencode</InlineCode>,{" "}
          <InlineCode>claude</InlineCode>, or <InlineCode>agy</InlineCode>.
          Omit it to change every host.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 space-y-4">
        <SectionHeading
          title="FAQ"
          description="Short answers about behavior, privacy, and removal."
        />

        <div className="overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/40 divide-y divide-neutral-800/70">
          {BEGINNER_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-4.5 py-3.5 text-left transition-colors hover:bg-neutral-900/30 cursor-pointer"
                >
                  <span className="text-sm font-medium text-neutral-200">
                    {faq.q}
                  </span>
                  <motion.svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.3, ease: DRAWER_EASE }
                    }
                  >
                    <path d="m4 6 4 4 4-4" />
                  </motion.svg>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                        height: {
                          duration: isOpen ? 0.45 : 0.3,
                          ease: DRAWER_EASE,
                        },
                        opacity: {
                          duration: isOpen ? 0.35 : 0.2,
                          delay: isOpen ? 0.05 : 0,
                          ease: "easeInOut",
                        },
                      }
                  }
                  className="overflow-hidden"
                >
                  <motion.div
                    animate={{
                      y: isOpen ? 0 : -6,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : {
                          duration: isOpen ? 0.4 : 0.25,
                          ease: DRAWER_EASE,
                        }
                    }
                    className="border-t border-neutral-800/60 px-4.5 py-3 text-sm leading-6 text-neutral-400"
                  >
                    <TextWithCode text={faq.a} />
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col gap-4 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-neutral-500">
          MIT-licensed. Local-first. No accounts, API keys, or telemetry.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            ← Product home
          </Link>
          <a
            href="https://github.com/faizjamadar18/waitfeed/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            Report an issue →
          </a>
        </div>
      </div>
    </div>
  );
}
