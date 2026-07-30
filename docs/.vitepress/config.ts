import { defineConfig } from "vitepress"

export default defineConfig({
  base: "/tomorrow-radio/",
  title: "Tomorrow Radio",
  description: "軽量 radiko / らじる★らじる / サイマルラジオ / ポッドキャスト 録音 CLI",
  cleanUrls: true,
  lastUpdated: true,

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
      { icon: "github", link: "https://github.com/watanabe3tipapa/tomorrow-radio" },
    ],

    footer: {
      message: "MIT License — ターミナルがラジオになる",
      copyright: `Copyright © ${new Date().getFullYear()} watanabe3tipapa`,
    },

    editLink: {
      pattern: "https://github.com/watanabe3tipapa/tomorrow-radio/edit/main/docs/:path",
      text: "このページを編集する",
    },

    search: {
      provider: "local",
    },
  },
})
