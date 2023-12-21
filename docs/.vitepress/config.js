import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/zml/',
  cleanUrls: true,
  title: "zepp-health/zml",
  titleTemplate: ':title | zepp-health/zml',
  description: "A mini development library for Zepp OS mini programs",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started' }
    ],

    sidebar: [
      {
        text: 'Docs',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'API Reference', link: '/api' }
        ]
      },
      {
        text: 'FAQ',
        items: [
          { text: 'Known Issues', link: './known-issues' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zepp-health/zml' }
    ],

    editLink: {
      pattern: 'https://github.com/google/zx/blob/gh-pages/:path',
    },

    search: {
      provider: 'local',
    },
  }
})
