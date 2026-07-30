import { getSource, detectSource } from "./sources/registry.js"
import type { SourceClient } from "./sources/types.js"
import { Recorder } from "./recorder/recorder.js"
import type { OutputFormat } from "./radiko/types.js"

export type LogLevel = "sys" | "rec" | "done" | "err"

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
}

export interface TransceiverEvents {
  onLog: (entry: LogEntry) => void
  onRecordStart: (outputPath: string) => void
  onRecordDone: (outputPath: string) => void
  onRecordError: (error: Error) => void
  onStationChange: (station: string) => void
  onModeChange: (mode: string) => void
  onProgress: (elapsed: number) => void
}

export interface StationItem {
  id: string
  name: string
}

export class Transceiver {
  recorder: Recorder
  private events: TransceiverEvents
  private _station: string
  private _mode: string
  private _currentProgram: { title: string; ft?: string; to?: string } | null = null
  private _format: OutputFormat
  private _source: SourceClient

  constructor(
    defaultStation: string,
    defaultFormat: OutputFormat,
    events: TransceiverEvents,
  ) {
    this._source = getSource(detectSource(defaultStation))
    this.recorder = new Recorder()
    this._station = defaultStation
    this._mode = "live"
    this._format = defaultFormat
    this.events = events

    this.recorder.on("start", (path: string) => {
      this.events.onRecordStart(path)
    })
    this.recorder.on("done", (data: { outputPath: string }) => {
      this.events.onRecordDone(data.outputPath)
    })
    this.recorder.on("error", (err: Error) => {
      this.events.onRecordError(err)
    })
    this.recorder.on("progress", (p: { elapsedSeconds: number }) => {
      this.events.onProgress(p.elapsedSeconds)
    })
  }

  get station(): string {
    return this._station
  }

  get mode(): string {
    return this._mode
  }

  get format(): OutputFormat {
    return this._format
  }

  get sourceType(): string {
    return this._source.type
  }

  private updateSource(): void {
    this._source = getSource(detectSource(this._station))
  }

  setStation(id: string): void {
    this._station = id
    this.updateSource()
    this.events.onStationChange(id)
    this.log("sys", `選局: ${id} (${this._source.type})`)
  }

  setMode(mode: string): void {
    this._mode = mode
    this.events.onModeChange(mode)
    this.log("sys", `モード切替: ${mode === "live" ? "LIVE" : "タイムフリー"}`)
  }

  setFormat(format: OutputFormat): void {
    this._format = format
    this.log("sys", `出力形式切替: ${format.toUpperCase()}`)
  }

  get currentProgram(): { title: string; ft?: string; to?: string } | null {
    return this._currentProgram
  }

  private log(level: LogLevel, message: string): void {
    this.events.onLog({ level, message, timestamp: new Date() })
  }

  async ping(): Promise<boolean> {
    this.log("sys", `${this._source.type} 認証確認中...`)
    try {
      await this._source.ensureAuth()
      this.log("sys", "接続完了")
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      this.log("err", `接続エラー: ${msg}`)
      return false
    }
  }

  async refreshCurrentProgram(): Promise<void> {
    try {
      const progs = await this._source.getPrograms(this._station)
      if (progs.length > 0) {
        this._currentProgram = {
          title: progs[0].title,
          ft: progs[0].startTime,
          to: progs[0].endTime,
        }
      } else {
        this._currentProgram = null
      }
    } catch {
      this._currentProgram = null
    }
  }

  async startRecording(duration?: number): Promise<void> {
    const now = new Date()
    const dateStr =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_` +
      `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`
    const outputPath = `${this._station}_${dateStr}.${this._format}`

    this.log("rec", `録音開始: ${this._station} (${this._mode.toUpperCase()}) → ${outputPath}`)

    try {
      const streamUrl = await this._source.getStreamUrl(
        this._station,
        this._mode,
      )
      const cmd = this._source.buildRecordCommand(
        streamUrl,
        outputPath,
        this._format,
        duration,
      )
      this.recorder.start({ ...cmd, outputPath })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      this.log("err", `録音開始エラー: ${msg}`)
    }
  }

  stopRecording(): void {
    this.recorder.stop()
    this.log("sys", "録音停止")
  }

  async scanStations(): Promise<StationItem[]> {
    const all: StationItem[] = []
    for (const type of ["radiko", "rajiru", "simulradio"] as const) {
      try {
        const src = getSource(type)
        if (type === "radiko") await src.ensureAuth()
        const stations = await src.getStations()
        all.push(...stations.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
      } catch {
        // skip failed sources
      }
    }
    return all
  }
}
