module.exports = {
  title: 'Rémi Delacourt',
  description: 'A website to host all my notes and thoughts',
  // head: [
  //   ['meta', { name: 'theme-color', content: '#3eaf7c' }],
  //   ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
  //   ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
  //   ['link', { rel: 'icon', href: '/images/mountain2.png' }]
  // ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Notes', link: '/notes/' }
    ],
    //logo: '/images/mountain2.png',
  },

  //plugins: [
  //  '@vuepress/plugin-back-to-top',
  //  '@vuepress/plugin-medium-zoom',
  //  '@maginapp/vuepress-plugin-katex',
  //],
  //markdown: {
    //extractHeaders: [ 'h2', 'h3', 'h4', 'h5', 'h6' ],
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
  //},
  //evergreen: true,
}