import type { SourceClient, SourceType, Station, Program } from "./types.js"
import { RadikoClient } from "../radiko/client.js"
import { getStations as getRajiruStations, getPrograms as getRajiruPrograms } from "../rajiru/client.js"
import { fetchStationList as fetchSimulStations, resolveStreamUrl } from "../simulradio/client.js"

export class RadikoSource implements SourceClient {
  readonly type = "radiko" as const
  private client = new RadikoClient()

  async ensureAuth(): Promise<void> {
    await this.client.ensureAuth()
  }

  async getStations(): Promise<Station[]> {
    const raw = await this.client.getStations()
    return raw.map((s) => ({
      id: s.id,
      name: s.name,
      source: "radiko" as SourceType,
    }))
  }

  async getPrograms(stationId: string): Promise<Program[]> {
    const raw = await this.client.getPrograms(stationId)
    return raw.map((p) => ({
      id: stationId,
      title: p.title,
      description: p.info,
      startTime: p.ft,
      endTime: p.to,
      pfm: p.pfm,
      source: "radiko" as SourceType,
    }))
  }

  async getStreamUrl(stationId: string, mode = "live", ft?: string, to?: string): Promise<string> {
    return this.client.getStreamUrl(
      stationId,
      mode as "live" | "tf",
      ft,
      to,
    )
  }

  buildRecordCommand(streamUrl: string, outputPath: string, format: string, duration?: number) {
    return this.client.buildRecordCommand(
      streamUrl,
      outputPath,
      format as "mp3" | "m4a",
      duration,
    )
  }
}

const SERVICE_LABEL: Record<string, string> = {
  r1: "NHK R1",
  r2: "NHK R2",
  fm: "NHK FM",
}

export class RajiruSource implements SourceClient {
  readonly type = "rajiru" as const

  async ensureAuth(): Promise<void> {
    // no auth needed
  }

  async getStations(): Promise<Station[]> {
    const raw = await getRajiruStations()
    return raw.map((s) => ({
      id: s.id,
      name: `${SERVICE_LABEL[s.service] || s.serviceName} ${s.areaName}`,
      source: "rajiru" as SourceType,
      area: s.area,
    }))
  }

  async getPrograms(stationId: string): Promise<Program[]> {
    const parts = stationId.split("_")
    const service = (parts[1] || "r1") as "r1" | "r2" | "fm"
    const area = parts[2] || "tokyo"
    const raw = await getRajiruPrograms(area, service)
    return raw.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      startTime: p.startTime,
      endTime: p.endTime,
      source: "rajiru" as SourceType,
    }))
  }

  async getStreamUrl(stationId: string): Promise<string> {
    const stations = await getRajiruStations()
    const st = stations.find((s) => s.id === stationId)
    if (!st) throw new Error(`Station not found: ${stationId}`)
    return st.hlsUrl
  }

  buildRecordCommand(streamUrl: string, outputPath: string, format: string, duration?: number) {
    const args = ["-i", streamUrl, "-vn"]
    if (duration) args.push("-t", String(duration))
    if (format === "mp3") {
      args.push("-acodec", "libmp3lame", "-qscale:a", "2")
    } else {
      args.push("-acodec", "copy", "-bsf:a", "aac_adtstoasc")
    }
    args.push(outputPath)
    return { bin: "ffmpeg", args }
  }
}

export class SimulradioSource implements SourceClient {
  readonly type = "simulradio" as const

  async ensureAuth(): Promise<void> {
    // no auth needed
  }

  async getStations(): Promise<Station[]> {
    const raw = await fetchSimulStations()
    return raw.map((s) => ({
      id: s.id,
      name: s.name,
      source: "simulradio" as SourceType,
      area: s.region,
    }))
  }

  async getPrograms(): Promise<Program[]> {
    return []
  }

  async getStreamUrl(stationId: string): Promise<string> {
    const stations = await fetchSimulStations()
    const st = stations.find((s) => s.id === stationId)
    if (!st) throw new Error(`Station not found: ${stationId}`)
    const url = await resolveStreamUrl(st)
    if (!url) throw new Error(`Could not resolve stream URL for ${stationId}`)
    return url
  }

  buildRecordCommand(streamUrl: string, outputPath: string, format: string, duration?: number) {
    const args = ["-i", streamUrl, "-vn"]
    if (duration) args.push("-t", String(duration))
    args.push("-c", "copy")
    args.push(outputPath)
    return { bin: "ffmpeg", args }
  }
}
