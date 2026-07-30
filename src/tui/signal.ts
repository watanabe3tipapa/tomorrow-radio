export function signalBar(connected: boolean, elapsed: number): string {
  if (!connected) return "{red-fg}[ OFF ]{/red-fg}"
  const level = elapsed > 0 ? 8 : elapsed > 0 ? 4 : 2
  const full = "\u2588".repeat(level)
  const empty = "\u2591".repeat(8 - level)
  const color = level >= 6 ? "green" : level >= 4 ? "yellow" : "red"
  return `{${color}-fg}${full}${empty}{/${color}-fg}`
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
