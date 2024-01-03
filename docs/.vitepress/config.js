import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/zml/',
  cleanUrls: true,
  title: "zepp-health/zml",
  titleTemplate: ':title | zepp-health/zml',
  description: "A mini development library for Zepp OS mini programs",
  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '中文',
      lang: 'zh', // optional, will be added  as `lang` attribute on `html` tag
      themeConfig: {
        nav: [
          { text: 'Home', link: '/zh' },
          { text: 'Docs', link: './getting-started' },
          {
            text: '0.x',
            items: [
              {text: 'Releases', link: 'https://github.com/zepp-health/zml/release'},
            ],
          },
        ],
        sidebar: [
          {
            text: '文档',
            items: [
              { text: '开始', link: './getting-started' },
              { text: 'API 参考', link: './api' }
            ]
          },
          {
            text: '常见问题',
            items: [
              { text: '已知问题', link: './known-issues' }
            ]
          }
        ],
      }
    }
  },
  head: [
    ['link', {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/zml/img/favicons/favicon-32x32.png'}],
    ['link', {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/zml/img/favicons/favicon-16x16.png'}],
    ['link', {rel: 'shortcut icon', href: '/zml/img/favicons/favicon.ico'}],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/img/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started' },
      {
        text: '0.x',
        items: [
          {text: 'Releases', link: 'https://github.com/zepp-health/zml/release'},
        ],
      },
    ],
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

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
          { text: 'Known Issues', link: '/known-issues' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zepp-health/zml' }
    ],

    editLink: {
      pattern: 'https://github.com/zepp-health/zml/tree/main/docs/:path',
    },

    externalLinkIcon: true,

    search: {
      provider: 'local',
    },
  }
})
