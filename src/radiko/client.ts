import { authenticate } from "./auth.js"
import { fetchStations, fetchPrograms } from "./epg.js"
import { resolveStreamUrl, buildRecordCommand } from "./stream.js"
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

  buildRecordCommand(
    streamUrl: string,
    outputPath: string,
    format: OutputFormat,
    duration?: number
  ): { bin: string; args: string[] } {
    const session = this.session!
    return buildRecordCommand(streamUrl, session.token, session.areaId, outputPath, format, duration)
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
