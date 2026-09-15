import type { RecordMode } from "./types.js"

function generateLsid(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")
}

export function resolveStreamUrl(
  stationId: string,
  mode: RecordMode,
  ft?: string,
  to?: string
): string {
  const lsid = generateLsid()
  if (mode === "tf" && ft && to) {
    return (
      `https://tf-f-rpaa-radiko.smartstream.ne.jp/tf/playlist.m3u8` +
      `?station_id=${stationId}` +
      `&start_at=${ft}&ft=${ft}` +
      `&end_at=${to}&to=${to}` +
      `&l=15&lsid=${lsid}&type=b`
    )
  }
  return (
    `https://f-radiko.smartstream.ne.jp/${stationId}/_definst_/simul-stream.stream/playlist.m3u8` +
    `?lsid=${lsid}&type=b`
  )
}

export function buildRecordCommand(
  streamUrl: string,
  token: string,
  areaId: string,
  outputPath: string,
  format: "mp3" | "m4a",
  duration?: number
): { bin: string; args: string[] } {
  const bin = "ffmpeg"
  // FFmpeg accepts custom headers as one CRLF-delimited block.  Passing
  // multiple -headers flags overwrites the first header on recent FFmpeg
  // versions, so the authentication token was omitted from HLS requests.
  const headers = `X-Radiko-AuthToken: ${token}\r\nX-Radiko-AreaId: ${areaId}\r\n`
  const args = [
    "-nostdin",
    "-http_seekable",
    "0",
    "-seekable",
    "0",
    "-headers",
    headers,
    "-user_agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "-i",
    streamUrl,
    "-vn",
  ]
  if (duration && duration > 0) {
    args.push("-t", String(duration))
  }
  if (format === "mp3") {
    args.push("-acodec", "libmp3lame", outputPath)
  } else {
    args.push("-acodec", "copy", "-bsf:a", "aac_adtstoasc", outputPath)
  }
  return { bin, args }
}

export function buildPlayCommand(
  streamUrl: string,
  token: string,
  areaId: string,
  volume = 100,
): { bin: string; args: string[] } {
  const bin = "ffplay"
  const headers = `X-Radiko-AuthToken: ${token}\r\nX-Radiko-AreaId: ${areaId}\r\n`
  const args = [
    "-nodisp",
    "-autoexit",
    "-loglevel",
    "quiet",
  ]
  if (volume !== 100) {
    args.push("-volume", String(Math.max(0, Math.min(100, volume))))
  }
  args.push(
    "-headers",
    headers,
    "-user_agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "-i",
    streamUrl,
  )
  return { bin, args }
}
