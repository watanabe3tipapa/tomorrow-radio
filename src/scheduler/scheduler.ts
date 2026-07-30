import { loadSchedule, addEntry, removeEntry } from "./store.js"
import type { ScheduleEntry } from "./store.js"

export class Scheduler {
  list(): ScheduleEntry[] {
    return loadSchedule()
  }

  add(
    station: string,
    start: string,
    duration: number,
    format: "mp3" | "m4a",
    source = "radiko",
  ): ScheduleEntry {
    return addEntry({ station, source, start, duration, format, enabled: true })
  }

  remove(id: string): boolean {
    return removeEntry(id)
  }

  exportCron(): string {
    const entries = loadSchedule()
    return entries
      .filter((e) => e.enabled)
      .map((e) => {
        const date = new Date(
          Number(e.start.slice(0, 4)),
          Number(e.start.slice(4, 6)) - 1,
          Number(e.start.slice(6, 8)),
          Number(e.start.slice(8, 10)),
          Number(e.start.slice(10, 12)),
        )
        const minute = date.getMinutes()
        const hour = date.getHours()
        const day = date.getDate()
        const month = date.getMonth() + 1
        return `${minute} ${hour} ${day} ${month} * tomorrow-radio live ${e.station} --duration ${e.duration} --format ${e.format}`
      })
      .join("\n")
  }
}
