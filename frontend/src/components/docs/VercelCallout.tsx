"use client";

import { type ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "important";

interface VercelCalloutProps {
  type?: CalloutType;
  title?: string;
  children?: ReactNode;
}

export function VercelCallout({
  type = "note",
  title,
  children,
}: VercelCalloutProps) {
  const defaultTitle =
    type === "note"
      ? "Good to know"
      : type === "tip"
        ? "Tip"
        : type === "warning"
          ? "Warning"
          : "Important";

  return (
    <div className="my-4 flex items-start justify-start gap-3 rounded-[6px] bg-[#1a1a1a] px-4 py-3 font-normal text-sm leading-[150%] text-[#ededed] [&_ul]:list-none [&_ul]:pl-0! [&_ul]:space-y-2 [&_ul]:my-0 [&_ul_li]:relative [&_ul_li]:pl-6! [&_ul_li]:before:absolute [&_ul_li]:before:top-[0.6em] [&_ul_li]:before:left-0 [&_ul_li]:before:size-[5px] [&_ul_li]:before:rounded-full [&_ul_li]:before:bg-[#878787] [&_ul_li]:before:content-[''] [&_code]:text-[12px]! [&_code]:font-mono [&_code]:rounded-[5px] [&_code]:px-[5px] [&_code]:py-[2px] [&_code]:bg-[#ffffff17]! [&_code]:border! [&_code]:border-[#ffffff24]! [&_code]:text-[#ededed]! [&_a]:font-normal [&_a]:text-[#ededed] [&_a]:underline [&_a]:decoration-1 [&_a]:decoration-[#878787] [&_a]:underline-offset-4 hover:[&_a]:decoration-white hover:[&_a]:text-white">
      <div className="shrink-0 mt-0.5 text-[#8e8e8e]">
        {type === "note" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 flex-none"
            fill="currentColor"
            data-slot="geist-icon"
            data-glyph="circular"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M6.25 7h1.5a1 1 0 0 1 1 1v4.25h-1.5V8.5h-1zM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
            />
          </svg>
        )}
        {type === "tip" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 flex-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 1.5a4.5 4.5 0 0 0-2.5 8.2V11a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V9.7A4.5 4.5 0 0 0 8 1.5z" />
            <line x1="6.5" y1="14" x2="9.5" y2="14" />
          </svg>
        )}
        {type === "warning" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 flex-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m8 2 6 11H2L8 2z" />
            <line x1="8" y1="6" x2="8" y2="9" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
        )}
        {type === "important" && (
          <svg
            viewBox="0 0 16 16"
            className="size-4 flex-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 1.5 2 4.5v5c0 3.5 3 5.5 6 6 3-.5 6-2.5 6-6v-5L8 1.5z" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="my-0 font-medium text-[#ededed] text-sm">
          {title ?? defaultTitle}
        </p>
        <div className="mt-[7px] text-sm text-[#ededed] leading-[150%]">
          {children ?? (
            <ul>
              <li>
                If you forget to create the root layout, Next.js will
                automatically create this file when running the development
                server with <code>next dev</code>.
              </li>
              <li>
                You can optionally use a{" "}
                <a
                  href="https://nextjs.org/docs/app/api-reference/file-conventions/src-folder"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <code>src</code> folder
                </a>{" "}
                in the root of your project to separate your application&apos;s
                code from configuration files.
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
