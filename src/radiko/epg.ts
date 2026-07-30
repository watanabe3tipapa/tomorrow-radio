import type { Station, Program } from "./types.js"

function matchWholeTag(
  xml: string,
  tag: string
): { outer: string; attrs: Record<string, string>; inner: string }[] {
  const results: { outer: string; attrs: Record<string, string>; inner: string }[] = []
  const regex = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "g")
  let match
  while ((match = regex.exec(xml)) !== null) {
    const attrStr = match[1]
    const inner = match[2].trim()
    const attrs: Record<string, string> = {}
    const attrRegex = /(\w+)\s*=\s*"([^"]*)"/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2]
    }
    results.push({ outer: match[0], attrs, inner })
  }
  return results
}

function innerXml(xml: string, tag: string): string[] {
  const results: string[] = []
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g")
  let match
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim())
  }
  return results
}

export async function fetchStations(areaId: string): Promise<Station[]> {
  const res = await fetch(
    `https://radiko.jp/v2/station/list/${areaId}.xml`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  )
  if (!res.ok) throw new Error(`Station list fetch failed: ${res.status}`)
  const xml = await res.text()

  const stationBlocks = innerXml(xml, "station")
  const stations: Station[] = []

  for (const block of stationBlocks) {
    const ids = innerXml(block, "id")
    const names = innerXml(block, "name")
    if (ids.length > 0 && names.length > 0) {
      stations.push({ id: ids[0], name: names[0] })
    }
  }

  return stations
}

export async function fetchPrograms(stationId: string): Promise<Program[]> {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const res = await fetch(
    `https://radiko.jp/v3/program/station/date/${dateStr}/${stationId}.xml`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  )
  if (!res.ok) throw new Error(`EPG fetch failed for ${stationId}: ${res.status}`)
  const xml = await res.text()

  const progTags = matchWholeTag(xml, "prog")
  const programs: Program[] = []

  for (const tag of progTags) {
    const titleArr = innerXml(tag.inner, "title")
    const pfmArr = innerXml(tag.inner, "pfm")
    const infoArr = innerXml(tag.inner, "info")
    const imgArr = innerXml(tag.inner, "img")

    programs.push({
      ft: tag.attrs.ft ?? "",
      to: tag.attrs.to ?? "",
      ftl: tag.attrs.ftl ?? "",
      tol: tag.attrs.tol ?? "",
      dur: tag.attrs.dur ?? "",
      title: titleArr[0] ?? "",
      pfm: pfmArr[0],
      info: infoArr[0],
      img: imgArr[0],
    })
  }

  return programs
}
