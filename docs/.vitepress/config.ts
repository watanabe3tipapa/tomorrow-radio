import { defineConfig } from "vitepress"

export default defineConfig({
  base: "/tomorrow-radio/",
  title: "Tomorrow Radio",
  description: "軽量 radiko 録音 CLI ツール",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/installation" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Installation", link: "/guide/installation" },
          { text: "Quick Start", link: "/guide/quickstart" },
          { text: "CLI Reference", link: "/guide/cli-reference" },
        ],
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/watanabe3tipapa/tomorrow-radio",
      },
    ],
  },
})
