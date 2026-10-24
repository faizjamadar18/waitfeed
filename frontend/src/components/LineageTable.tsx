import { COMPARISON_ROWS } from "@/lib/data";

export function LineageTable() {
  return (
    <section id="why" className="bg-(--bg-primary) py-14 md:py-20 border-t border-(--rule-default)">
      <div className="mx-auto max-w-300 px-6">
        <div className="mb-8 max-w-[62ch]">
          <h2
            className="font-display text-[26px] md:text-[32px] leading-[1.15] tracking-[-0.02em] text-(--ink-primary) mb-3"
            style={{ fontWeight: 400 }}
          >
            Every medium had a developer wait.
          </h2>
          <p className="font-body text-[15px] leading-[1.65] text-(--ink-secondary)">
            Waiting on builds produced alt-tabs. Waiting on CI produced Slack distraction.
            AI agents create long idle gaps — WaitFeed fills them with ambient signal, not sponsored filler:
            the deliberate opposite take, because the line above your prompt is nobody&apos;s ad inventory.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-160">
            <thead>
              <tr className="border-b border-(--rule-strong) font-data text-[11px] text-(--ink-tertiary) uppercase tracking-wider">
                <th scope="col" className="w-[24%] pb-2.5 font-normal">
                  era / medium
                </th>
                <th scope="col" className="w-[24%] pb-2.5 font-normal">
                  the wait surface
                </th>
                <th scope="col" className="w-[26%] pb-2.5 font-normal">
                  developer reaction
                </th>
                <th scope="col" className="w-[26%] pb-2.5 font-normal">
                  the outcome
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => {
                if (row.isWaitFeed) {
                  return (
                    <tr key={idx} className="border-b border-(--rule-default) bg-[#101914]/40">
                      <th
                        scope="row"
                        className="font-display text-[17px] tracking-[-0.01em] text-(--ink-primary) py-4 pr-4"
                        style={{ fontWeight: 400 }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-(--accent-color)"></span>
                          {row.medium}
                        </span>
                      </th>
                      <td className="font-data text-[13px] text-(--ink-primary) py-4 pr-4 font-semibold">
                        {row.surface}
                      </td>
                      <td className="font-data text-[13px] text-(--accent-color) py-4 pr-4 font-semibold">
                        {row.reaction}
                      </td>
                      <td className="py-3">
                        <span
                          className="inline-block border border-dashed border-(--accent-color) px-3 py-1.5 font-data text-[12px] text-(--accent-color) font-medium"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(135deg, var(--accent-glow) 0 6px, transparent 6px 12px)",
                          }}
                        >
                          {row.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={idx}
                    className="border-b border-(--rule-subtle) hover:bg-(--bg-secondary)/50 transition-colors"
                  >
                    <th
                      scope="row"
                      className="font-display text-[17px] tracking-[-0.01em] text-(--ink-primary) py-3.5 pr-4"
                      style={{ fontWeight: 400 }}
                    >
                      {row.medium}
                    </th>
                    <td className="font-data text-[13px] text-(--ink-secondary) py-3.5 pr-4">
                      {row.surface}
                    </td>
                    <td className="font-data text-[13px] text-(--ink-secondary) py-3.5 pr-4">
                      {row.reaction}
                    </td>
                    <td className="font-data text-[13px] text-(--ink-tertiary) py-3.5">
                      {row.outcome}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
