import { defaultTheme } from '@vuepress/theme-default'

export default {
    theme: defaultTheme({
        title: 'Rémi Delacourt',
        repo: 'https://github.com/Flechman/flechman.github.io',
        logo: '/images/mountain1.png',
        logoDark: '/images/mountain2.png',
        navbar: [
            { text: 'Home', link: '/' },
            { text: 'Notes', link: '/notes/' },
        ],
    })
}