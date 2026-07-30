import { fetchFeed, downloadCommand } from "./feed.js"
import type { PodcastFeed, PodcastEpisode } from "./types.js"

export class PodcastClient {
  async fetchFeed(url: string): Promise<PodcastFeed> {
    return fetchFeed(url)
  }

  buildDownloadCommand(
    episode: PodcastEpisode,
    outputPath: string,
  ): { bin: string; args: string[] } {
    return downloadCommand(episode, outputPath)
  }
}
