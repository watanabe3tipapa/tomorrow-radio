import type { RajiruConfig, RajiruAreaConfig, RajiruStation, RajiruProgram } from "./types.js"

const SERVICE_NAMES: Record<string, string> = {
  r1: "NHK R1",
  r2: "NHK R2",
  fm: "NHK FM",
}

const AREA_KEY_MAP: Record<string, string> = {
  sapporo: "010",
  sendai: "040",
  tokyo: "130",
  nagoya: "230",
  osaka: "270",
  hiroshima: "340",
  matsuyama: "380",
  fukuoka: "400",
  kumamoto: "430",
}

let _configCache: RajiruConfig | null = null

async function fetchConfigRaw(): Promise<string> {
  const res = await fetch("https://www.nhk.or.jp/radio/config/config_web.xml", {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  if (!res.ok) throw new Error(`NHK config fetch failed: ${res.status}`)
  return res.text()
}

function xmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`))
  if (m) return m[1].trim()
  const m2 = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m2 ? m2[1].trim() : ""
}

function parseConfig(xml: string): RajiruConfig {
  const areas: RajiruAreaConfig[] = []
  const dataBlocks = xml.match(/<data>([\s\S]*?)<\/data>/g) || []

  for (const block of dataBlocks) {
    const area = xmlText(block, "area")
    if (!area) continue
    areas.push({
      areajp: xmlText(block, "areajp"),
      area,
      apikey: xmlText(block, "apikey"),
      areakey: xmlText(block, "areakey"),
      r1hls: xmlText(block, "r1hls"),
      r2hls: xmlText(block, "r2hls"),
      fmhls: xmlText(block, "fmhls"),
    })
  }

  return {
    areas,
    apiNow: xmlText(xml, "url_program_noa"),
    apiDay: xmlText(xml, "url_program_day"),
    apiDetail: xmlText(xml, "url_program_detail"),
  }
}

export async function getConfig(): Promise<RajiruConfig> {
  if (_configCache) return _configCache
  const xml = await fetchConfigRaw()
  _configCache = parseConfig(xml)
  return _configCache
}

export async function getStations(): Promise<RajiruStation[]> {
  const config = await getConfig()
  const stations: RajiruStation[] = []

  for (const area of config.areas) {
    const areaKey = AREA_KEY_MAP[area.area] || area.areakey
    if (area.r1hls) {
      stations.push({
        id: `rajiru_r1_${area.area}`,
        name: `NHK R1 ${area.areajp}`,
        area: area.area,
        areaName: area.areajp,
        service: "r1",
        serviceName: SERVICE_NAMES.r1,
        hlsUrl: area.r1hls,
      })
    }
    if (area.r2hls) {
      stations.push({
        id: `rajiru_r2_${area.area}`,
        name: `NHK R2 ${area.areajp}`,
        area: area.area,
        areaName: area.areajp,
        service: "r2",
        serviceName: SERVICE_NAMES.r2,
        hlsUrl: area.r2hls,
      })
    }
    if (area.fmhls) {
      stations.push({
        id: `rajiru_fm_${area.area}`,
        name: `NHK FM ${area.areajp}`,
        area: area.area,
        areaName: area.areajp,
        service: "fm",
        serviceName: SERVICE_NAMES.fm,
        hlsUrl: area.fmhls,
      })
    }
  }

  return stations
}

function areaToApiKey(area: string): string {
  return AREA_KEY_MAP[area] || "130"
}

export async function getPrograms(
  area: string,
  service: "r1" | "r2" | "fm" = "r1",
): Promise<RajiruProgram[]> {
  const areaKey = areaToApiKey(area)
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const url = `https://api.nhk.jp/r8/pg/date/${service}/${areaKey}/${dateStr}.json`

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  if (!res.ok) {
    if (res.status === 404) return []
    throw new Error(`NHK program fetch failed: ${res.status}`)
  }
  const data = await res.json() as Record<string, any>
  const svc = data[service]
  if (!svc?.publication) return []

  return svc.publication.map((p: any) => ({
    id: p.id || "",
    title: p.name || "Untitled",
    description: p.description || "",
    startTime: p.startDate || "",
    endTime: p.endDate || "",
    area,
  })) as RajiruProgram[]
}

export function buildRecordCommand(
  station: RajiruStation,
  outputPath: string,
  format: "mp3" | "m4a",
  duration?: number,
): { bin: string; args: string[] } {
  const args: string[] = [
    "-i", station.hlsUrl,
    "-vn",
  ]
  if (duration) args.push("-t", String(duration))
  if (format === "mp3") {
    args.push("-acodec", "libmp3lame", "-qscale:a", "2")
  } else {
    args.push("-acodec", "copy", "-bsf:a", "aac_adtstoasc")
  }
  args.push(outputPath)
  return { bin: "ffmpeg", args }
}
