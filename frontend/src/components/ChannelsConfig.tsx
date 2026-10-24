"use client";

import { useState } from "react";
import { CHANNEL_COLORS } from "@/lib/data";

export function ChannelsConfig() {
  const [sources, setSources] = useState({
    hn: true,
    devto: true,
    github: true,
    reddit: true,
  });
  const [dwellSeconds, setDwellSeconds] = useState(20);
  const [rssList, setRssList] = useState<string[]>([
    "https://simonwillison.net/atom/entries/",
  ]);
  const [newRss, setNewRss] = useState("");

  const toggleSource = (key: keyof typeof sources) => {
    setSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addRss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRss.trim() || rssList.length >= 10) return;
    setRssList((prev) => [...prev, newRss.trim()]);
    setNewRss("");
  };

  const removeRss = (idx: number) => {
    setRssList((prev) => prev.filter((_, i) => i !== idx));
  };

  const configJson = JSON.stringify(
    {
      sources,
      rssUrls: rssList,
      dwellSeconds,
      setupDone: true,
    },
    null,
    2
  );

  return (
    <section id="channels" className="bg-(--bg-primary) py-14 md:py-20 border-t border-(--rule-default)">
      <div className="mx-auto max-w-300 px-6">
        <div className="mb-8 max-w-[62ch]">
          <h2
            className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) mb-3"
            style={{ fontWeight: 400 }}
          >
            Zero-cloud channels. Personal feeds.
          </h2>
          <p className="font-body text-[15px] leading-[1.65] text-(--ink-secondary)">
            Toggle built-in channels with keys <code className="font-data text-[12px] text-(--ink-primary)">1-4</code>{" "}
            inside the reader, or bring up to 10 of your own private RSS/Atom feeds.
            Toggles persist instantly — muted channels vanish from the reader at once, and the next fetch cycle never
            even contacts them. Card dwell is one narrow knob in the same file (5–120 s, default 20 s).
          </p>
        </div>

        <div className="grid md:grid-cols-[1.1fr_1fr] gap-8 items-start">
          {/* Interactive Channel Controls */}
          <div className="border border-(--rule-default) bg-(--bg-surface) p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-(--rule-subtle) pb-3">
              <span className="font-data text-[12px] uppercase tracking-wider text-(--ink-secondary)">
                Default Channels (Keys 1–4)
              </span>
              <span className="font-data text-[11px] text-(--ink-tertiary)">
                Toggles persist to config.json
              </span>
            </div>

            <div className="space-y-3">
              {[
                { key: "hn" as const, name: "Hacker News", badge: "HN", keyNum: "1", desc: "Top tech and engineering discussions" },
                { key: "devto" as const, name: "dev.to", badge: "DEV", keyNum: "2", desc: "Tutorials, architectures, community articles" },
                { key: "github" as const, name: "GitHub Trending", badge: "GH", keyNum: "3", desc: "New repos racing up the stars chart this week" },
                { key: "reddit" as const, name: "Reddit r/programming", badge: "R/PROG", keyNum: "4", desc: "The day's programming links and debates" },
              ].map((ch) => (
                <div
                  key={ch.key}
                  onClick={() => toggleSource(ch.key)}
                  className="flex items-center justify-between p-3 border border-(--rule-subtle) hover:border-(--rule-strong) bg-[#0C0C10] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-bold text-black uppercase font-data"
                      style={{ backgroundColor: CHANNEL_COLORS[ch.badge] }}
                    >
                      {ch.badge}
                    </span>
                    <div>
                      <div className="font-data text-[13px] text-(--ink-primary) font-medium">
                        [{ch.keyNum}] {ch.name}
                      </div>
                      <div className="text-[12px] text-(--ink-secondary) font-body">
                        {ch.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-data text-[11px] px-2 py-0.5 border ${
                      sources[ch.key]
                        ? "border-(--accent-color) text-(--accent-color) bg-(--accent-glow)"
                        : "border-[#2D2D36] text-[#5C5C66]"
                    }`}
                  >
                    {sources[ch.key] ? "ENABLED" : "MUTED"}
                  </div>
                </div>
              ))}
            </div>

            {/* Dwell Time Slider */}
            <div className="border-t border-(--rule-subtle) pt-4">
              <div className="flex items-center justify-between text-[12px] font-data mb-2">
                <span className="text-(--ink-secondary)">Card Dwell Duration:</span>
                <span className="text-(--accent-color) font-semibold">{dwellSeconds} seconds</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={dwellSeconds}
                onChange={(e) => setDwellSeconds(Number(e.target.value))}
                className="w-full accent-(--accent-color) cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-(--ink-tertiary) font-data mt-1">
                <span>5s (fast rotation)</span>
                <span>20s (default)</span>
                <span>120s (deep read)</span>
              </div>
            </div>

            {/* Custom RSS Feeds Input */}
            <div className="border-t border-(--rule-subtle) pt-4">
              <span className="font-data text-[12px] uppercase tracking-wider text-(--ink-secondary) block mb-2">
                Bring-Your-Own RSS (Max 10)
              </span>
              <form onSubmit={addRss} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/feed.xml"
                  value={newRss}
                  onChange={(e) => setNewRss(e.target.value)}
                  className="flex-1 bg-[#0A0A0C] border border-(--rule-default) px-3 py-1.5 font-data text-[12px] text-(--ink-primary) focus:ring-1 focus:ring-(--accent-color) focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-(--rule-strong) hover:bg-(--rule-default) text-(--ink-primary) font-data text-[12px] px-3 py-1.5 cursor-pointer"
                >
                  Add RSS
                </button>
              </form>
              <div className="mt-2 space-y-1">
                {rssList.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] font-data text-(--ink-secondary) bg-[#0A0A0C] px-2.5 py-1 border border-(--rule-subtle)"
                  >
                    <span className="truncate max-w-70">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeRss(idx)}
                      className="text-[#5C5C66] hover:text-red-400 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Config.json Preview */}
          <div className="border border-(--rule-strong) bg-[#0A0A0C] p-5 font-data text-[12px] shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1E1E24] pb-2 mb-3 text-[11px] text-[#8A8A94]">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-(--accent-color)"></span>
                ~/.config/waitfeed/config.json
              </span>
              <span className="text-[10px] text-[#5C5C66]">Created on your first /news open</span>
            </div>
            <pre className="text-[#EDEDF0] leading-relaxed overflow-x-auto selection:bg-[#2D2D36]">
              <code>{configJson}</code>
            </pre>
            <div className="mt-4 pt-3 border-t border-[#1E1E24] text-[11px] text-[#8A8A94] flex items-center justify-between">
              <span>Data stays on your machine</span>
              <span className="text-(--accent-color) font-semibold">100% keyless</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
