import type { SimulStation } from "./types.js"

async function resolveAsx(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const text = await res.text()
    const urls: string[] = []
    const regex = /<ref\s+href\s*=\s*"([^"]+)"/g
    let m
    while ((m = regex.exec(text)) !== null) {
      urls.push(m[1])
    }
    return urls
  } catch {
    return []
  }
}

export async function fetchStationList(): Promise<SimulStation[]> {
  const res = await fetch("https://www.simulradio.info/", {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  if (!res.ok) throw new Error(`SimulRadio fetch failed: ${res.status}`)
  const html = await res.text()

  const stations: SimulStation[] = []
  const lines = html.split("\n")
  let currentRegion = ""

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Region header
    const h2match = line.match(/<h2[^>]*>(.*?)<\/h2>/)
    if (h2match) {
      const stripped = h2match[1].replace(/<[^>]*>/g, "").trim()
      if (stripped) {
        currentRegion = stripped
      }
      continue
    }

    // Look for ASX link in a row that has the radio button image
    const asxMatch = line.match(/href="(https?:\/\/[^"]+\.asx)"/)
    if (!asxMatch) continue

    const asxUrl = asxMatch[1]
    // The station name is in the next <tr> row
    let name = ""
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      const nameMatch = lines[j].match(/<strong><a[^>]*>([^<]+)<\/a><\/strong><br/)
      if (nameMatch) {
        name = nameMatch[1].trim()
        break
      }
    }
    if (!name) continue

    stations.push({
      id: `simul_${name.replace(/[^a-zA-Z0-9\u3040-\u9FFF\uFF00-\uFFEF]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")}`,
      name,
      region: currentRegion,
      asxUrl,
    })
  }

  return stations
}

export async function resolveStreamUrl(station: SimulStation): Promise<string | undefined> {
  if (station.streamUrl) return station.streamUrl
  const urls = await resolveAsx(station.asxUrl)
  const httpUrl = urls.find((u) => u.startsWith("http"))
  const mmsUrl = urls.find((u) => u.startsWith("mms"))
  station.streamUrl = httpUrl || mmsUrl
  return station.streamUrl
}
