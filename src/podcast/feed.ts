import type { PodcastFeed, PodcastEpisode } from "./types.js"

function textContent(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ""
}

function allTextContent(xml: string, tag: string): string[] {
  const results: string[] = []
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g")
  let m
  while ((m = regex.exec(xml)) !== null) {
    results.push(m[1].trim())
  }
  return results
}

function attr(xml: string, tag: string, attrName: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*?${attrName}\\s*=\\s*["']([^"']*)["']`))
  return m ? m[1].trim() : ""
}

function cdataToText(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim()
}

export async function fetchFeed(url: string): Promise<PodcastFeed> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  const xml = await res.text()

  // RSS 2.0
  const channelMatch = xml.match(/<channel>([\s\S]*)<\/channel>/)
  if (!channelMatch) throw new Error("Invalid RSS feed")
  const channel = channelMatch[1]

  const title = cdataToText(textContent(channel, "title")) || "Untitled"
  const description = cdataToText(textContent(channel, "description"))
  const author = cdataToText(textContent(channel, "author")) ||
    textContent(channel, "itunes:author")
  const link = textContent(channel, "link")
  const image = attr(channel, "itunes:image", "href") ||
    textContent(textContent(channel, "image"), "url")

  // Parse items
  const itemBlocks = allTextContent(channel, "item")
  const episodes: PodcastEpisode[] = []

  for (const item of itemBlocks) {
    const enclosureMatch = item.match(/<enclosure[^>]*>/)
    let audioUrl = ""
    let audioType = ""
    let audioSize = 0
    if (enclosureMatch) {
      audioUrl = attr(enclosureMatch[0], "enclosure", "url")
      audioType = attr(enclosureMatch[0], "enclosure", "type")
      audioSize = Number(attr(enclosureMatch[0], "enclosure", "length")) || 0
    }

    // Fallback: look for media:content
    if (!audioUrl) {
      audioUrl = attr(item, "media:content", "url")
      audioType = attr(item, "media:content", "type")
    }

    if (!audioUrl) continue

    episodes.push({
      guid: cdataToText(textContent(item, "guid")) ||
        textContent(item, "guid") || audioUrl,
      title: cdataToText(textContent(item, "title")) || "Untitled",
      description: cdataToText(textContent(item, "description")),
      pubDate: textContent(item, "pubDate"),
      duration: textContent(item, "itunes:duration"),
      audioUrl,
      audioType,
      audioSize,
      image: attr(item, "itunes:image", "href"),
    })
  }

  return { title, description, author, link, image, episodes }
}

export function downloadCommand(
  episode: PodcastEpisode,
  outputPath: string,
): { bin: string; args: string[] } {
  return {
    bin: "ffmpeg",
    args: [
      "-user_agent",
      "Mozilla/5.0",
      "-i",
      episode.audioUrl,
      "-vn",
      "-c",
      "copy",
      outputPath,
    ],
  }
}
