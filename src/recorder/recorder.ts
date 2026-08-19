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
  private stopRequested = false
  private forceStopTimer: NodeJS.Timeout | null = null
  private processFinished = false

  get running(): boolean {
    return this._running
  }

  get outputPath(): string {
    return this._outputPath
  }

  private clearForceStopTimer(): void {
    if (this.forceStopTimer) {
      clearTimeout(this.forceStopTimer)
      this.forceStopTimer = null
    }
  }

  private finish(error?: Error): void {
    if (this.processFinished) return
    this.processFinished = true
    this.clearForceStopTimer()
    this._running = false
    this.proc = null

    if (error) {
      this.emit("error", error)
    } else {
      this.emit("done", { outputPath: this._outputPath })
    }
  }

  start(options: RecordOptions): void {
    if (this._running) {
      this.emit("error", new Error("already recording"))
      return
    }

    this._outputPath = options.outputPath
    this._running = true
    this._startTime = Date.now()
    this.stopRequested = false
    this.processFinished = false
    this.emit("start", options.outputPath)

    const proc = spawn(options.bin, options.args, {
      // FFmpeg accepts "q" on stdin and then writes the output trailer,
      // ensuring m4a files remain playable after the user stops recording.
      stdio: ["pipe", "ignore", "pipe"],
    })
    this.proc = proc

    let stderrBuf = ""

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString()
      // Keep the buffer bounded while retaining the most recent progress line.
      if (stderrBuf.length > 8_192) stderrBuf = stderrBuf.slice(-4_096)
      const timeMatch = stderrBuf.match(/time=(\d+):(\d+):(\d+)\.(\d+)/)
      if (timeMatch) {
        const hours = Number.parseInt(timeMatch[1], 10)
        const minutes = Number.parseInt(timeMatch[2], 10)
        const seconds = Number.parseInt(timeMatch[3], 10)
        const elapsed = hours * 3600 + minutes * 60 + seconds
        this.emit("progress", { elapsedSeconds: elapsed } as RecordProgress)
      }
    })

    proc.on("error", (err) => {
      this.finish(err)
    })

    proc.on("exit", (code, signal) => {
      if (code === 0 || this.stopRequested) {
        this.finish()
        return
      }
      const detail = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`
      this.finish(new Error(`ffmpeg exited with ${detail}`))
    })
  }

  stop(): void {
    const proc = this.proc
    if (!this._running || !proc || this.stopRequested) return

    this.stopRequested = true
    // A graceful quit writes container metadata before FFmpeg exits.
    if (proc.stdin && !proc.stdin.destroyed) {
      proc.stdin.write("q\n")
      proc.stdin.end()
    }

    // Network reads can occasionally keep FFmpeg alive.  Fall back to a
    // termination signal after a short grace period without losing the normal
    // graceful-stop path.
    this.forceStopTimer = setTimeout(() => {
      if (this.proc === proc && !this.processFinished && proc.exitCode === null) {
        proc.kill("SIGTERM")
      }
    }, 5_000)
  }

  elapsedSeconds(): number {
    if (!this._running) return 0
    return Math.round((Date.now() - this._startTime) / 1000)
  }
}
