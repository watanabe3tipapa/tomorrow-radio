import { spawn, type ChildProcess } from "node:child_process"
import { EventEmitter } from "node:events"

export interface RecordOptions {
  bin: string
  args: string[]
  outputPath: string
}

export interface RecordProgress {
  elapsedSeconds: number
}

export class Recorder extends EventEmitter {
  private proc: ChildProcess | null = null
  private _running = false
  private _startTime = 0
  private _outputPath = ""

  get running(): boolean {
    return this._running
  }

  get outputPath(): string {
    return this._outputPath
  }

  start(options: RecordOptions): void {
    if (this._running) {
      this.emit("error", new Error("already recording"))
      return
    }

    this._outputPath = options.outputPath
    this._running = true
    this._startTime = Date.now()
    this.emit("start", options.outputPath)

    this.proc = spawn(options.bin, options.args, {
      stdio: ["ignore", "ignore", "pipe"],
    })

    let stderrBuf = ""

    this.proc.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString()
      // Parse FFmpeg time progress from stderr
      const timeMatch = stderrBuf.match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
      if (timeMatch) {
        const hours = Number.parseInt(timeMatch[1], 10)
        const minutes = Number.parseInt(timeMatch[2], 10)
        const seconds = Number.parseInt(timeMatch[3], 10)
        const elapsed = hours * 3600 + minutes * 60 + seconds
        this.emit("progress", { elapsedSeconds: elapsed } as RecordProgress)
      }
    })

    this.proc.on("error", (err) => {
      this._running = false
      this.emit("error", err)
    })

    this.proc.on("exit", (code) => {
      this._running = false
      if (code === 0) {
        this.emit("done", { outputPath: options.outputPath })
      } else {
        this.emit("error", new Error(`ffmpeg exited with code ${code}`))
      }
    })
  }

  stop(): void {
    if (!this._running || !this.proc) return
    this.proc.kill("SIGTERM")
    // Give it a moment, then force kill
    setTimeout(() => {
      if (this.proc && !this.proc.killed) {
        this.proc.kill("SIGKILL")
      }
    }, 3000)
  }

  elapsedSeconds(): number {
    if (!this._running) return 0
    return Math.round((Date.now() - this._startTime) / 1000)
  }
}
