export type SourceType = "radiko" | "rajiru" | "simulradio" | "podcast"

export interface Station {
  id: string
  name: string
  source: SourceType
  area?: string
}

export interface Program {
  id: string
  title: string
  description?: string
  startTime?: string
  endTime?: string
  pfm?: string
  source: SourceType
}

export interface RecordCommand {
  bin: string
  args: string[]
}

export interface SourceClient {
  readonly type: SourceType
  getStations(): Promise<Station[]>
  getPrograms(stationId: string): Promise<Program[]>
  getStreamUrl(stationId: string, mode?: string, ft?: string, to?: string): Promise<string>
  buildRecordCommand(streamUrl: string, outputPath: string, format: string, duration?: number): RecordCommand
  ensureAuth(): Promise<void>
}
