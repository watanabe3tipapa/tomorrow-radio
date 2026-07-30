export interface RajiruAreaConfig {
  areajp: string
  area: string
  apikey: string
  areakey: string
  r1hls: string
  r2hls: string
  fmhls: string
}

export interface RajiruConfig {
  areas: RajiruAreaConfig[]
  apiNow: string
  apiDay: string
  apiDetail: string
}

export interface RajiruStation {
  id: string
  name: string
  area: string
  areaName: string
  service: 'r1' | 'r2' | 'fm'
  serviceName: string
  hlsUrl: string
}

export interface RajiruProgram {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  area: string
}
