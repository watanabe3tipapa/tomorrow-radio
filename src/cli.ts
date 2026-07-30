import { Command } from "commander"
import { RadikoClient } from "./radiko/client.js"
import { PodcastClient } from "./podcast/client.js"
import { Scheduler } from "./scheduler/scheduler.js"
import { loadConfig } from "./utils/config.js"
import { startTui } from "./tui/app.js"
import { getSource, detectSource } from "./sources/registry.js"
import type { SourceType, SourceClient } from "./sources/types.js"
import { fetchStationList as fetchSimulStations, resolveStreamUrl } from "./simulradio/client.js"
import { getStations as getRajiruStations } from "./rajiru/client.js"
function sourceFor(stationId: string): SourceClient {
  return getSource(detectSource(stationId))
}

async function ensureSourceAuth(stationId: string): Promise<void> {
  const src = sourceFor(stationId)
  if (src.ensureAuth) await src.ensureAuth()
}

function outputPath(stationId: string, ext: string): string {
  const now = new Date()
  const dateStr =
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_` +
    `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`
  return `${stationId}_${dateStr}.${ext}`
}

export function run(argv: string[]): void {
  const config = loadConfig()
  const client = new RadikoClient()
  const scheduler = new Scheduler()
  const program = new Command()

  program
    .name("tomorrow-radio")
    .description("軽量 radiko / らじる★らじる / サイマルラジオ / ポッドキャスト 録音 CLI")
    .version("0.1.0")
    .exitOverride()
    .showHelpAfterError(false)

  let handled = false

  program
    .command("status")
    .description("認証状態を確認")
    .action(async () => {
      handled = true
      console.log("認証確認中...")
      try {
        const session = await client.ensureAuth()
        console.log(`認証OK  エリア: ${session.areaId}`)
        console.log(`トークン: ${session.token.slice(0, 12)}...`)
      } catch (e) {
        console.error("認証エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }
    })

  program
    .command("scan")
    .description("利用可能な放送局一覧を表示")
    .option("-s, --source <type>", "ソース種別 (radiko/rajiru/simulradio)")
    .action(async (options) => {
      handled = true
      try {
        const filterType = options.source as SourceType | undefined

        if (!filterType || filterType === "radiko") {
          console.log("--- radiko ---")
          await client.ensureAuth()
          const radikoStations = await client.getStations()
          for (const s of radikoStations) {
            console.log(`  ${s.id.padEnd(6)} ${s.name}`)
          }
          console.log(`  ${radikoStations.length} 局`)
        }

        if (!filterType || filterType === "rajiru") {
          console.log("\n--- らじる★らじる ---")
          const rajiruStations = await getRajiruStations()
          for (const s of rajiruStations) {
            console.log(`  ${s.id.padEnd(24)} ${s.name}: ${s.hlsUrl.slice(0, 40)}...`)
          }
          console.log(`  ${rajiruStations.length} 局`)
        }

        if (!filterType || filterType === "simulradio") {
          console.log("\n--- サイマルラジオ ---")
          const simulStations = await fetchSimulStations()
          for (const s of simulStations) {
            console.log(`  ${s.id.padEnd(30)} ${s.name}`)
          }
          console.log(`  ${simulStations.length} 局`)
        }
      } catch (e) {
        console.error("エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }
    })

  program
    .command("epg")
    .description("番組表を表示")
    .argument("<station>", "放送局ID")
    .action(async (station) => {
      handled = true
      try {
        const src = sourceFor(station)
        await ensureSourceAuth(station)
        const programs = await src.getPrograms(station)
        if (programs.length === 0) {
          console.log(`${station} の番組が見つかりません`)
          return
        }
        for (const p of programs) {
          const st = p.startTime?.replace(/[T+\-:]/g, "").slice(0, 12) || ""
          const et = p.endTime?.replace(/[T+\-:]/g, "").slice(8, 12) || ""
          const time = st ? `${st.slice(0, 4)}/${st.slice(4, 6)}/${st.slice(6, 8)} ${st.slice(8, 10)}:${st.slice(10, 12)}-${et.slice(0, 2)}:${et.slice(2, 4)}` : ""
          const pfm = p.pfm ? ` [${p.pfm}]` : ""
          console.log(`  ${time}  ${p.title}${pfm}`)
        }
      } catch (e) {
        console.error("エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }
    })

  program
    .command("live")
    .description("ライブ録音")
    .argument("<station>", "放送局ID")
    .option("-d, --duration <秒>", "録音時間(秒)", String(config.defaultDuration))
    .option("-f, --format <形式>", "出力形式 (mp3/m4a)", config.defaultFormat)
    .action(async (station, options) => {
      handled = true
      const duration = Number.parseInt(options.duration, 10)
      const format = options.format === "mp3" ? "mp3" : "m4a"

      const src = sourceFor(station)
      await ensureSourceAuth(station)

      const op = outputPath(station, format)
      console.log(`録音開始: ${station} (${duration}秒, ${format.toUpperCase()})`)
      console.log(`出力: ${op}`)

      try {
        const streamUrl = await src.getStreamUrl(station, "live")
        const cmd = src.buildRecordCommand(streamUrl, op, format, duration)
        const { spawn } = await import("node:child_process")
        const proc = spawn(cmd.bin, cmd.args, {
          stdio: ["ignore", "ignore", "inherit"],
        })
        proc.on("exit", (code) => {
          if (code === 0) {
            console.log(`録音完了: ${op}`)
          } else {
            console.error(`ffmpeg がエラーコード ${code} で終了しました`)
            process.exit(1)
          }
        })
      } catch (e) {
        console.error("録音エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }
    })

  program
    .command("tf")
    .description("タイムフリー録音 (radiko のみ)")
    .argument("<station>", "放送局ID (例: TBS)")
    .argument("<ft>", "開始 (YYYYMMDDHHmm)")
    .argument("<to>", "終了 (YYYYMMDDHHmm)")
    .option("-f, --format <形式>", "出力形式 (mp3/m4a)", config.defaultFormat)
    .action(async (station, ft, to, options) => {
      handled = true
      const format = options.format === "mp3" ? "mp3" : "m4a"

      console.log(`認証中...`)
      try {
        await client.ensureAuth()
      } catch (e) {
        console.error("認証エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }

      const op = `${station.toUpperCase()}_${ft}.${format}`
      console.log(
        `タイムフリー録音: ${station.toUpperCase()} ${ft.slice(0, 8)} ${ft.slice(8, 10)}:${ft.slice(10, 12)} ～ ${to.slice(8, 10)}:${to.slice(10, 12)}`
      )
      console.log(`出力: ${op}`)

      try {
        const streamUrl = await client.getStreamUrl(station.toUpperCase(), "tf", ft, to)
        const cmd = client.buildRecordCommand(streamUrl, op, format)
        const { spawn } = await import("node:child_process")
        const proc = spawn(cmd.bin, cmd.args, {
          stdio: ["ignore", "ignore", "inherit"],
        })
        proc.on("exit", (code) => {
          if (code === 0) {
            console.log(`録音完了: ${op}`)
          } else {
            console.error(`ffmpeg がエラーコード ${code} で終了しました`)
            process.exit(1)
          }
        })
      } catch (e) {
        console.error("録音エラー:", e instanceof Error ? e.message : e)
        process.exit(1)
      }
    })

  program
    .command("schedule")
    .description("予約録音管理")
    .argument("[subcommand]", "add / list / remove / export")
    .argument("[args...]", "追加引数")
    .action((subcommand, args) => {
      handled = true
      if (!subcommand || subcommand === "list") {
        const entries = scheduler.list()
        if (entries.length === 0) {
          console.log("予約はありません")
          return
        }
        for (const e of entries) {
          console.log(
            `  ${e.id}  ${e.start.slice(0, 8)} ${e.start.slice(8, 10)}:${e.start.slice(10, 12)} ${e.station} ${e.duration}秒 ${e.format.toUpperCase()} ${e.source || "radiko"} ${e.enabled ? "" : "[停止中]"}`
          )
        }
        return
      }

      if (subcommand === "add") {
        const [station, date, time, durationStr, format] = args
        if (!station || !date || !time || !durationStr) {
          console.error(
            "使い方: tomorrow-radio schedule add <station> <YYYYMMDD> <HHmm> <duration_sec> [format]"
          )
          return
        }
        const start = `${date}${time}`
        const duration = Number.parseInt(durationStr, 10)
        const fmt = format === "mp3" ? "mp3" : "m4a"
        const source = detectSource(station)
        const entry = scheduler.add(
          source === "radiko" ? station.toUpperCase() : station,
          start,
          duration,
          fmt,
          source,
        )
        console.log(`予約追加: ${entry.id} (${source})`)
        return
      }

      if (subcommand === "remove") {
        const [id] = args
        if (!id) {
          console.error("使い方: tomorrow-radio schedule remove <id>")
          return
        }
        const ok = scheduler.remove(id)
        console.log(ok ? `予約削除: ${id}` : `予約 ${id} が見つかりません`)
        return
      }

      if (subcommand === "export") {
        console.log(scheduler.exportCron())
        return
      }

      console.error(
        "サブコマンド: add / list / remove / export"
      )
    })

  const podcast = new PodcastClient()

  program
    .command("podcast")
    .description("ポッドキャスト操作")
    .argument("<subcommand>", "feed / download")
    .argument("[args...]", "追加引数")
    .action(async (subcommand, args) => {
      handled = true
      if (subcommand === "feed") {
        const [url] = args
        if (!url) {
          console.error("使い方: tomorrow-radio podcast feed <url>")
          return
        }
        try {
          const feed = await podcast.fetchFeed(url)
          console.log(`タイトル: ${feed.title}`)
          console.log(`説明: ${feed.description.slice(0, 200)}`)
          if (feed.author) console.log(`作者: ${feed.author}`)
          console.log(`エピソード数: ${feed.episodes.length}`)
          for (let i = 0; i < feed.episodes.length; i++) {
            const e = feed.episodes[i]
            console.log(`  [${i}] ${e.title} (${e.duration || "?"})`)
          }
        } catch (e) {
          console.error("フィード取得エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      if (subcommand === "download") {
        const [url, indexStr] = args
        if (!url || !indexStr) {
          console.error("使い方: tomorrow-radio podcast download <url> <episode-index>")
          return
        }
        const index = Number.parseInt(indexStr, 10)
        try {
          const feed = await podcast.fetchFeed(url)
          const episode = feed.episodes[index]
          if (!episode) {
            console.error(`エピソード #${index} が見つかりません`)
            return
          }
          const slug = episode.title.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 40)
          const ext = episode.audioType?.includes("mp3") ? "mp3" : "m4a"
          const op = `${slug}.${ext}`
          console.log(`ダウンロード: ${episode.title}`)
          console.log(`出力: ${op}`)
          const cmd = podcast.buildDownloadCommand(episode, op)
          const { spawn } = await import("node:child_process")
          const proc = spawn(cmd.bin, cmd.args, {
            stdio: ["ignore", "ignore", "inherit"],
          })
          proc.on("exit", (code) => {
            if (code === 0) {
              console.log(`完了: ${op}`)
            } else {
              console.error(`ffmpeg がエラーコード ${code} で終了しました`)
              process.exit(1)
            }
          })
        } catch (e) {
          console.error("ダウンロードエラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      console.error("サブコマンド: feed / download")
    })

  program
    .command("simulradio")
    .description("サイマルラジオ操作")
    .argument("<subcommand>", "scan / live")
    .argument("[args...]", "追加引数")
    .action(async (subcommand, args) => {
      handled = true
      if (subcommand === "scan") {
        try {
          const stations = await fetchSimulStations()
          if (stations.length === 0) {
            console.log("局が見つかりませんでした")
            return
          }
          for (const s of stations) {
            console.log(`  ${s.id.padEnd(30)} ${s.name}`)
          }
          console.log(`\n${stations.length} 局`)
        } catch (e) {
          console.error("エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      if (subcommand === "live") {
        const [id, durationStr] = args
        if (!id) {
          console.error("使い方: tomorrow-radio simulradio live <id> [duration_sec]")
          return
        }
        const duration = Number.parseInt(durationStr, 10) || config.defaultDuration
        try {
          const stations = await fetchSimulStations()
          const station = stations.find((s) => s.id === id)
          if (!station) {
            console.error(`局 ${id} が見つかりません`)
            return
          }
          const streamUrl = await resolveStreamUrl(station)
          if (!streamUrl) {
            console.error("ストリームURLを解決できませんでした")
            return
          }
          console.log(`録音開始: ${station.name} (${duration}秒)`)
          console.log(`ストリーム: ${streamUrl}`)
          const op = outputPath(id, "m4a")
          const args2: string[] = ["-i", streamUrl, "-t", String(duration), "-c", "copy", op]
          const { spawn } = await import("node:child_process")
          const proc = spawn("ffmpeg", args2, {
            stdio: ["ignore", "ignore", "inherit"],
          })
          proc.on("exit", (code) => {
            if (code === 0) {
              console.log(`録音完了: ${op}`)
            } else {
              console.error(`ffmpeg がエラーコード ${code} で終了しました`)
              process.exit(1)
            }
          })
        } catch (e) {
          console.error("録音エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      console.error("サブコマンド: scan / live")
    })

  program
    .command("rajiru")
    .description("らじる★らじる操作")
    .argument("<subcommand>", "scan / epg / live")
    .argument("[args...]", "追加引数")
    .action(async (subcommand, args) => {
      handled = true
      const rajiruSource = getSource("rajiru")

      if (subcommand === "scan") {
        try {
          const stations = await rajiruSource.getStations()
          if (stations.length === 0) {
            console.log("局が見つかりませんでした")
            return
          }
          for (const s of stations) {
            console.log(`  ${s.id.padEnd(24)} ${s.name}`)
          }
          console.log(`\n${stations.length} 局`)
        } catch (e) {
          console.error("エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      if (subcommand === "epg") {
        const [id] = args
        if (!id) {
          console.error("使い方: tomorrow-radio rajiru epg <station-id>")
          return
        }
        try {
          const programs = await rajiruSource.getPrograms(id)
          for (const p of programs) {
            const st = p.startTime?.replace(/[T+\-:]/g, "").slice(0, 12) || ""
            const et = p.endTime?.replace(/[T+\-:]/g, "").slice(8, 12) || ""
            const time = st ? `${st.slice(0, 4)}/${st.slice(4, 6)}/${st.slice(6, 8)} ${st.slice(8, 10)}:${st.slice(10, 12)}-${et.slice(0, 2)}:${et.slice(2, 4)}` : ""
            console.log(`  ${time}  ${p.title}`)
          }
        } catch (e) {
          console.error("エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      if (subcommand === "live") {
        const [id, durationStr] = args
        if (!id) {
          console.error("使い方: tomorrow-radio rajiru live <id> [duration_sec]")
          return
        }
        const duration = Number.parseInt(durationStr, 10) || config.defaultDuration
        const format = config.defaultFormat
        try {
          const streamUrl = await rajiruSource.getStreamUrl(id)
          const op = outputPath(id, format)
          console.log(`録音開始: ${id} (${duration}秒)`)
          console.log(`出力: ${op}`)
          const cmd = rajiruSource.buildRecordCommand(streamUrl, op, format, duration)
          const { spawn } = await import("node:child_process")
          const proc = spawn(cmd.bin, cmd.args, {
            stdio: ["ignore", "ignore", "inherit"],
          })
          proc.on("exit", (code) => {
            if (code === 0) {
              console.log(`録音完了: ${op}`)
            } else {
              console.error(`ffmpeg がエラーコード ${code} で終了しました`)
              process.exit(1)
            }
          })
        } catch (e) {
          console.error("録音エラー:", e instanceof Error ? e.message : e)
          process.exit(1)
        }
        return
      }

      console.error("サブコマンド: scan / epg / live")
    })

  program
    .command("tui")
    .description("対話型 TUI を起動")
    .option("-s, --station <id>", "初期選局", config.defaultStation)
    .option("-f, --format <形式>", "出力形式", config.defaultFormat)
    .action((options) => {
      handled = true
      startTui(
        options.station || config.defaultStation,
        options.format === "mp3" ? "mp3" : "m4a",
      )
    })

  const userArgs = argv.slice(2)
  const knownCommands = [
    "status",
    "scan",
    "epg",
    "live",
    "tf",
    "schedule",
    "podcast",
    "simulradio",
    "rajiru",
    "tui",
    "help",
  ]
  const isKnown =
    userArgs.length > 0 &&
    (knownCommands.includes(userArgs[0]) || userArgs[0].startsWith("-"))

  if (isKnown) {
    try {
      program.parse(argv)
    } catch {
      // Commander exit was overridden
    }
    return
  }

  // Default: launch TUI
  startTui(config.defaultStation, config.defaultFormat)
}
