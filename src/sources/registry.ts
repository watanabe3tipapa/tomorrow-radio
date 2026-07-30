import type { SourceClient, SourceType } from "./types.js"
import { RadikoSource, RajiruSource, SimulradioSource } from "./adapters.js"

const instances = new Map<SourceType, SourceClient>()

export function getSource(type: SourceType): SourceClient {
  let s = instances.get(type)
  if (!s) {
    s = createSource(type)
    instances.set(type, s)
  }
  return s
}

function createSource(type: SourceType): SourceClient {
  switch (type) {
    case "radiko":
      return new RadikoSource()
    case "rajiru":
      return new RajiruSource()
    case "simulradio":
      return new SimulradioSource()
    default:
      throw new Error(`Unknown source type: ${type}`)
  }
}

export function detectSource(id: string): SourceType {
  if (id.startsWith("rajiru_")) return "rajiru"
  if (id.startsWith("simul_")) return "simulradio"
  return "radiko"
}
