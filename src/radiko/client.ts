import { authenticate } from "./auth.js"
import { fetchStations, fetchPrograms } from "./epg.js"
import { resolveStreamUrl, buildRecordCommand, buildPlayCommand } from "./stream.js"
import type { AuthSession, Station, Program, RecordMode, OutputFormat } from "./types.js"

export class RadikoClient {
  private session: AuthSession | null = null

  async ensureAuth(force = false): Promise<AuthSession> {
    if (!this.session || force) {
      this.session = await authenticate(force)
    }
    return this.session
  }

  async getStations(): Promise<Station[]> {
    const session = await this.ensureAuth()
    return fetchStations(session.areaId)
  }

  async getPrograms(stationId: string): Promise<Program[]> {
    await this.ensureAuth()
    return fetchPrograms(stationId)
  }

  async getStreamUrl(stationId: string, mode: RecordMode, ft?: string, to?: string): Promise<string> {
    return resolveStreamUrl(stationId, mode, ft, to)
  }

  async getAreaId(): Promise<string> {
    const session = await this.ensureAuth()
    return session.areaId
  }

  async probePlayable(stationId: string): Promise<{ ok: boolean; reason?: string }> {
    const session = await this.ensureAuth()
    const url = resolveStreamUrl(stationId, "live")
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "X-Radiko-AuthToken": session.token,
          "X-Radiko-AreaId": session.areaId,
        },
        signal: AbortSignal.timeout(5000),
      })
      if (res.status === 200) return { ok: true }
      const reason =
        res.status === 403 ? "配信エリア外・geoブロック" : `HTTP ${res.status}`
      return { ok: false, reason }
    } catch {
      return { ok: false, reason: "接続不可" }
    }
  }

  buildRecordCommand(
    streamUrl: string,
    outputPath: string,
    format: OutputFormat,
    duration?: number
  ): { bin: string; args: string[] } {
    const session = this.session!
    return buildRecordCommand(streamUrl, session.token, session.areaId, outputPath, format, duration)
  }

  buildPlayCommand(streamUrl: string, volume = 100): { bin: string; args: string[] } {
    const session = this.session!
    return buildPlayCommand(streamUrl, session.token, session.areaId, volume)
  }

  async getCurrentProgram(stationId: string): Promise<Program | null> {
    const programs = await this.getPrograms(stationId)
    const now = new Date()
    const nowStr =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}` +
      `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`
    return programs.find((p) => p.ft <= nowStr && p.to > nowStr) ?? null
  }
}
