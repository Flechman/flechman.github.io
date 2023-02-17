module.exports = {
    title: 'Rémi Delacourt',
    description: 'A website to host all my notes and thoughts',
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Notes', link: '/notes' }
      ]
    }
  }
module.exports = {
  //base: '/',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: 'Rémi Delacourt',
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: 'A website to host all my notes and thoughts',

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'icon', href: '/images/mountain1.png' }]
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    docsDir: 'docs',
    editLinks: true,
    // custom text for edit link. Defaults to "Edit this page"
    editLinkText: 'Edit This Page On GitHub',
    lastUpdated: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Notes', link: '/notes' }
      // {
      //   text: 'Java',
      //   items: [
      //     { text: 'Java Basics', link: '/backend/java/javaBasics' },
      //     { text: 'Java Utilities', link: '/backend/java/javaUtils' },
      //     { text: 'Java Concurrency', link: '/backend/java/javaConcurrency' },
      //     { text: 'IO', link: '/backend/java/javaIO' },
      //     { text: 'Java Miscellanea', link: '/backend/java/javaMisc' },
      //     { text: 'Java Virtual Machine', link: '/backend/java/JVM' },
      //   ]
      // },
    ],
    // displayAllHeaders: true, // Default: false
    // activeHeaderLinks: false, // Default: true
    sidebarDepth: 5,    // optional, defaults to 1
    sidebar: {
      '/backend/java/': [
        {
          title: 'Java',
          collapsable: false, // optional, defaults to true
          children: [
            // '',
            'javaBasics',
            'javaUtils',
            'javaConcurrency',
            'javaIO',
            'javaMisc',
            'JVM',
          ]
        },
      ],
      '/src/guide/': [
        {
          title: 'Guide',
          collapsable: false,
          children: [
            '',
            'using-vue',
          ]
        },
        {
          title: 'Group 1',   // required
          path: '/foo/',      // optional, link of the title, which should be an absolute path and must exist
          collapsable: false, // optional, defaults to true
          sidebarDepth: 1,    // optional, defaults to 1
          children: [
            '/'
          ]
        },
        {
          title: 'Group 2',
          children: [ /* ... */ ],
          initialOpenGroupIndex: -1 // optional, defaults to 0, defines the index of initially opened subgroup
        }
      ],
      '/': 'auto',
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    '@vuepress/plugin-back-to-top',
    '@vuepress/plugin-medium-zoom',
    '@maginapp/vuepress-plugin-katex',
  ],
  markdown: {
    extractHeaders: [ 'h2', 'h3', 'h4', 'h5', 'h6' ],
    // slugify: (str) => {
    //   // eslint-disable-next-line no-control-regex
    //   const rControl = /[\u0000-\u001f]/g
    //   const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’–—<>,.?/]+/g
    //   const rCombining = /[\u0300-\u036F]/g
    //   // Split accented characters into components
    //   return str.normalize('NFKD')
    //     // Remove accents
    //     .replace(rCombining, '')
    //     // Remove control characters
    //     .replace(rControl, '')
    //     // Replace special characters
    //     .replace(rSpecial, '-')
    //     // Remove continuous separators
    //     .replace(/\-{2,}/g, '-')
    //     // Remove prefixing and trailing separators
    //     .replace(/^\-+|\-+$/g, '')
    //     // ensure it doesn't start with a number (#121)
    //     .replace(/^(\d)/, '_$1')
    //     // lowercase
    //     .toLowerCase()
    // },
  },
  evergreen: true,
}