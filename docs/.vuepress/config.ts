import { defaultTheme } from '@vuepress/theme-default'
import { katexPlugin } from '@renovamen/vuepress-plugin-katex' //yarn add @renovamen/vuepress-plugin-katex@next
//import tocPlugin  from '@vuepress/plugin-toc'

export default {
    theme: defaultTheme({
        title: 'Rémi Delacourt',
        repo: 'https://github.com/Flechman/flechman.github.io',
        logo: '/images/mountain1.png',
        logoDark: '/images/mountain2.png',
        navbar: [
            { text: 'Home', link: '/' },
            { text: 'Notes', link: '/notes/notes.html' },
        ],
        editLink: false,
        contributors: false,
        themePlugins: {
            backToTop: true,
            externalLinkIcon: false,
        },
    }),
    plugins: [
        katexPlugin()
    ],
}