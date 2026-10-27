// Shared stdin collector for the Claude Code runner bundles. Both the
// statusline (session payload) and the scheduler (hook payload, --heartbeat /
// --idle) read everything the host pipes; a silent host and a TTY (manual
// test run) resolve immediately with an empty string.
export function readStdinText(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("")
      return
    }
    let buffer = ""
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      clearTimeout(guard)
      resolve(buffer)
    }
    const guard = setTimeout(finish, 2_000)
    if (typeof guard.unref === "function") guard.unref()
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk: string) => {
      buffer += chunk
    })
    process.stdin.once("end", finish)
    process.stdin.once("close", finish)
    process.stdin.once("error", finish)
  })
}
