import blessed from "blessed"
import { Transceiver } from "../transceiver.js"
import type { LogEntry } from "../transceiver.js"
import { signalBar, formatTime } from "./signal.js"
import { showStationDialog } from "./station.js"
import { showScheduleDialog } from "./schedule.js"
import { Scheduler } from "../scheduler/scheduler.js"
import type { OutputFormat } from "../radiko/types.js"

export function startTui(
  defaultStation: string,
  defaultFormat: OutputFormat,
): void {
  const transceiver = new Transceiver(defaultStation, defaultFormat, {
    onLog: handleLog,
    onRecordStart: handleRecordStart,
    onRecordDone: handleRecordDone,
    onRecordError: handleRecordError,
    onStationChange: handleStationChange,
    onModeChange: handleModeChange,
    onProgress: handleProgress,
  })

  const scheduler = new Scheduler()

  let chatLines: string[] = []
  let logLines: string[] = []
  let currentMode: string = "live"
  let currentStation: string = defaultStation
  let currentFormat: OutputFormat = defaultFormat
  let recordingElapsed = 0
  let isConnected = false
  let isRecording = false
  let stationList: { id: string; name: string }[] = []

  const screen = blessed.screen({
    smartCSR: true,
    title: "Tomorrow Radio",
    dockBorders: true,
    fullUnicode: true,
  })

  // ── Header ──
  const header = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: 3,
    border: { type: "line" },
    style: { border: { fg: "cyan" }, fg: "white", bg: "black" },
    tags: true,
    content: "",
  })

  const sourceLabel: Record<string, string> = {
    radiko: "RADIKO",
    rajiru: "らじる",
    simulradio: "SIMUL",
  }

  function renderHeader(): void {
    const src = transceiver.sourceType
    const bar = signalBar(isConnected, recordingElapsed)
    const elapsed =
      isRecording && recordingElapsed > 0 ? formatTime(recordingElapsed) : "--:--:--"
    const dot = isRecording
      ? "{red-fg}● REC{/red-fg}"
      : isConnected
        ? "{green-fg}●{/green-fg}"
        : "{red-fg}● OFF{/red-fg}"
    const modeLabel =
      currentMode === "live"
        ? "{green-fg}LIVE{/green-fg}"
        : "{yellow-fg}TIMEFREE{/yellow-fg}"
    const fmtLabel =
      currentFormat === "mp3" ? "MP3" : "m4a"
    const srcTag = `{cyan-fg}${sourceLabel[src] || src}{/cyan-fg}`
    header.setContent(
      ` ${bar}  ${elapsed}  ${dot}` +
        `  │  {bold}${currentStation}{/bold}  │  ${srcTag}  │  ${modeLabel}  │  ${fmtLabel}`,
    )
    screen.render()
  }

  // ── Main (program info / chat) ──
  const main = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: "100%",
    height: "100%-7",
    border: { type: "line" },
    style: { border: { fg: "white" }, fg: "white", bg: "black" },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", track: { bg: "grey" }, style: { bg: "cyan" } },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    content: "",
  })

  function appendChat(text: string, color: string): void {
    chatLines.push(`{${color}-fg}${text}{/${color}-fg}`)
    if (chatLines.length > 500) chatLines = chatLines.slice(-500)
    main.setContent(chatLines.join("\n"))
    main.setScrollPerc(100)
    screen.render()
  }

  // ── Log ──
  const logPane = blessed.box({
    parent: screen,
    bottom: 4,
    left: 0,
    width: "100%",
    height: "100%-3",
    border: { type: "line" },
    style: { border: { fg: "yellow" }, fg: "grey", bg: "black" },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: " ", track: { bg: "grey" }, style: { bg: "yellow" } },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    content: "",
  })

  function appendLog(entry: LogEntry): void {
    const time = entry.timestamp.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    const prefix =
      entry.level === "rec"
        ? "{red-fg}[REC]{/red-fg}"
        : entry.level === "done"
          ? "{green-fg}[DONE]{/green-fg}"
          : entry.level === "err"
            ? "{red-fg}[ERR]{/red-fg}"
            : "{yellow-fg}[SYS]{/yellow-fg}"
    logLines.push(`${prefix} ${entry.message}  {grey-fg}${time}{/grey-fg}`)
    if (logLines.length > 500) logLines = logLines.slice(-500)
    logPane.setContent(logLines.slice(-30).join("\n"))
    logPane.setScrollPerc(100)
    screen.render()
  }

  // ── Footer (PTT bar) ──
  const footer = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    style: { fg: "white", bg: "blue" },
    content: "",
  })

  function renderFooter(status: string, bg: string): void {
    footer.setContent(` ${status}`)
    footer.style.bg = bg
    screen.render()
  }

  // ── Event handlers ──
  function handleLog(entry: LogEntry): void {
    appendLog(entry)
  }

  function handleRecordStart(path: string): void {
    isRecording = true
    recordingElapsed = 0
    appendChat(`[REC] 録音開始 → ${path}`, "red")
    renderFooter("[ RECORDING ]  Enter:停止  s:選局  q:終了", "red")
    renderHeader()
  }

  function handleRecordDone(path: string): void {
    isRecording = false
    appendChat(`[DONE] 録音完了: ${path}`, "green")
    renderFooter(
      "[▶ PTT]  Enter:録音  Tab:切替  s:選局  m:モード  f:形式  l:予約  q:終了",
      "blue",
    )
    renderHeader()
  }

  function handleRecordError(err: Error): void {
    isRecording = false
    appendLog({
      level: "err",
      message: `録音エラー: ${err.message}`,
      timestamp: new Date(),
    })
    renderHeader()
  }

  function handleStationChange(station: string): void {
    currentStation = station
    appendChat(`選局: ${station} (${transceiver.sourceType})`, "cyan")
    renderHeader()
  }

  function handleModeChange(mode: string): void {
    currentMode = mode
    appendChat(`モード切替: ${mode.toUpperCase()}`, "magenta")
    renderHeader()
  }

  function handleProgress(elapsed: number): void {
    recordingElapsed = elapsed
    renderHeader()
  }

  // ── Keyboard ──
  const panes = [main, logPane]
  let paneIndex = 0

  screen.key(["q", "C-c"], () => process.exit(0))

  screen.key(["tab"], () => {
    if (isRecording) return
    paneIndex = (paneIndex + 1) % panes.length
    panes[paneIndex].focus()
    renderFooter(
      `フォーカス: ${paneIndex === 0 ? "番組情報" : "ログ"}`,
      "blue",
    )
  })

  screen.key(["s"], async () => {
    if (isRecording) return
    if (stationList.length === 0) {
      appendLog({
        level: "sys",
        message: "放送局一覧を取得中...",
        timestamp: new Date(),
      })
      try {
        stationList = await transceiver.scanStations()
        appendLog({
          level: "sys",
          message: `${stationList.length} 局を検出`,
          timestamp: new Date(),
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        appendLog({
          level: "err",
          message: `放送局一覧取得エラー: ${msg}`,
          timestamp: new Date(),
        })
        return
      }
    }
    showStationDialog(screen, stationList, (id) => {
      transceiver.setStation(id)
    })
  })

  screen.key(["m"], () => {
    if (isRecording) return
    const src = transceiver.sourceType
    if (src !== "radiko") {
      appendLog({
        level: "sys",
        message: `${src} はタイムフリー非対応`,
        timestamp: new Date(),
      })
      return
    }
    const newMode = currentMode === "live" ? "tf" : "live"
    transceiver.setMode(newMode)
  })

  screen.key(["f"], () => {
    if (isRecording) return
    const newFormat: OutputFormat = currentFormat === "mp3" ? "m4a" : "mp3"
    currentFormat = newFormat
    transceiver.setFormat(newFormat)
  })

  screen.key(["l"], () => {
    if (isRecording) return
    const entries = scheduler.list()
    showScheduleDialog(screen, entries)
  })

  screen.key(["enter"], async () => {
    if (isRecording) {
      transceiver.stopRecording()
    } else {
      await transceiver.startRecording()
    }
  })

  // ── Init ──
  renderHeader()
  renderFooter(
    "[▶ PTT]  Enter:録音  Tab:切替  s:選局  m:モード  f:形式  l:予約  q:終了",
    "blue",
  )
  appendLog({
    level: "sys",
    message: "Tomorrow Radio 起動",
    timestamp: new Date(),
  })
  appendLog({
    level: "sys",
    message: "接続確認中...",
    timestamp: new Date(),
  })

  transceiver.ping().then((ok) => {
    isConnected = ok
    appendLog({
      level: "sys",
      message: ok
        ? "接続完了、録音可能です"
        : "接続に失敗しました",
      timestamp: new Date(),
    })
    transceiver.refreshCurrentProgram().then(() => {
      const prog = transceiver.currentProgram
      if (prog) {
        const start = prog.ft?.replace(/[T+\-:]/g, "").slice(8, 12) ?? "??"
        const end = prog.to?.replace(/[T+\-:]/g, "").slice(8, 12) ?? "??"
        appendChat(
          `[NOW] ${prog.title}  (${start.slice(0, 2)}:${start.slice(2, 4)}～${end.slice(0, 2)}:${end.slice(2, 4)})`,
          "white",
        )
      }
    })
    transceiver.scanStations().then((stations) => {
      stationList = stations
    })
  })

  main.focus()
  screen.render()
}
