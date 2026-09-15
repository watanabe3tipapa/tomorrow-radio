import { spawn, type ChildProcess } from "node:child_process"
import { EventEmitter } from "node:events"

export interface PlayOptions {
  bin: string
  args: string[]
}

export class Player extends EventEmitter {
  private proc: ChildProcess | null = null
  private _playing = false
  private stopRequested = false
  private forceStopTimer: NodeJS.Timeout | null = null
  private processFinished = false

  get playing(): boolean {
    return this._playing
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
    this._playing = false
    this.proc = null

    if (error) {
      this.emit("error", error)
    } else {
      this.emit("done")
    }
  }

  start(options: PlayOptions): void {
    if (this._playing) {
      this.emit("error", new Error("already playing"))
      return
    }

    this._playing = true
    this.stopRequested = false
    this.processFinished = false
    this.emit("start")

    const proc = spawn(options.bin, options.args, {
      // ffplay is driven through the TUI/CLI, never steals the terminal.
      stdio: ["pipe", "ignore", "ignore"],
    })
    this.proc = proc

    proc.on("error", (err) => {
      this.finish(err)
    })

    proc.on("exit", (code, signal) => {
      if (code === 0 || this.stopRequested) {
        this.finish()
        return
      }
      const detail = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`
      this.finish(new Error(`ffplay exited with ${detail}`))
    })
  }

  stop(): void {
    const proc = this.proc
    if (!this._playing || !proc || this.stopRequested) return

    this.stopRequested = true
    // "q" is ffplay's quit key; writing it to stdin ends the process.
    if (proc.stdin && !proc.stdin.destroyed) {
      proc.stdin.write("q\n")
      proc.stdin.end()
    }

    // Fall back to a signal if the process refuses to exit.
    this.forceStopTimer = setTimeout(() => {
      if (this.proc === proc && !this.processFinished && proc.exitCode === null) {
        proc.kill("SIGTERM")
      }
    }, 3_000)
  }
}