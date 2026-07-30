import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export interface Config {
  radikoUrl: string
  outputDir: string
  defaultFormat: "mp3" | "m4a"
  defaultDuration: number
  defaultStation: string
}

const DEFAULT_CONFIG: Config = {
  radikoUrl: "https://radiko.jp",
  outputDir: join(homedir(), "tomorrow-radio", "recordings"),
  defaultFormat: "m4a",
  defaultDuration: 3600,
  defaultStation: "TBS",
}

function appDir(): string {
  const dir = join(homedir(), "tomorrow-radio")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function configPath(): string {
  return join(appDir(), "config.json")
}

export function loadConfig(): Config {
  try {
    const raw = readFileSync(configPath(), "utf-8")
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: Config): void {
  const dir = appDir()
  writeFileSync(join(dir, "config.json"), JSON.stringify(config, null, 2))
}
