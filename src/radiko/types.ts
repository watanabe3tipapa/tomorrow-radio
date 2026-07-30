export interface AreaInfo {
  areaId: string
  areaName: string
}

export interface AuthSession {
  token: string
  areaId: string
  acquiredAt: number
}

export interface Station {
  id: string
  name: string
  logo?: string
}

export interface Program {
  ft: string
  to: string
  ftl: string
  tol: string
  dur: string
  title: string
  pfm?: string
  info?: string
  img?: string
}

export interface StreamInfo {
  url: string
  token: string
  areaId: string
  duration: number
}

export type RecordMode = "live" | "tf"
export type OutputFormat = "mp3" | "m4a"
