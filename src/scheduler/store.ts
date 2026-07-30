import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export interface ScheduleEntry {
  id: string
  station: string
  source: string
  start: string
  duration: number
  format: "mp3" | "m4a"
  enabled: boolean
}

const SCHEDULE_PATH = join(homedir(), "tomorrow-radio", "schedule.json")

let _cache: ScheduleEntry[] | null = null

function ensureDir(): void {
  const dir = join(homedir(), "tomorrow-radio")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function loadSchedule(): ScheduleEntry[] {
  if (_cache) return _cache
  try {
    const raw = readFileSync(SCHEDULE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as ScheduleEntry[]
    _cache = parsed.map(migrateEntry)
    return _cache
  } catch {
    _cache = []
    return _cache
  }
}

function migrateEntry(e: any): ScheduleEntry {
  return {
    source: e.source || "radiko",
    id: e.id,
    station: e.station,
    start: e.start,
    duration: e.duration,
    format: e.format || "m4a",
    enabled: e.enabled !== false,
  }
}

export function saveSchedule(entries: ScheduleEntry[]): void {
  ensureDir()
  _cache = entries
  writeFileSync(SCHEDULE_PATH, JSON.stringify(entries, null, 2))
}

export function addEntry(entry: Omit<ScheduleEntry, "id">): ScheduleEntry {
  const entries = loadSchedule()
  const id = `${entry.station}_${entry.start}_${Date.now()}`
  const full: ScheduleEntry = { id, ...entry }
  entries.push(full)
  saveSchedule(entries)
  return full
}

export function removeEntry(id: string): boolean {
  const entries = loadSchedule()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return false
  entries.splice(idx, 1)
  saveSchedule(entries)
  return true
}
