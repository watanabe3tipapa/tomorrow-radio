export interface PodcastFeed {
  title: string
  description: string
  author?: string
  link?: string
  image?: string
  episodes: PodcastEpisode[]
}

export interface PodcastEpisode {
  guid: string
  title: string
  description?: string
  pubDate: string
  duration?: string
  audioUrl: string
  audioType?: string
  audioSize?: number
  image?: string
}
