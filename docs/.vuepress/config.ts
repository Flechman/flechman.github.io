//import { defaultTheme } from '@vuepress/theme-default'
import { katexPlugin } from '@renovamen/vuepress-plugin-katex'
import { path } from '@vuepress/utils'
import { defaultTheme, defineUserConfig } from 'vuepress'

export default defineUserConfig({
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
    head: [['script', {}, `
        var frontImageRef = '/images/Stellisee.jpg';
        var frontImage = document.createElement('img');
        frontImage.src = frontImageRef;
        frontImage.onload = function() {
            var frontpage = document.getElementById('frontpage');
            frontpage.style.background = 'url('+frontImageRef+')';
            frontpage.style.backgroundRepeat = 'no-repeat';
            frontpage.style.backgroundSize = 'cover';
            frontpage.style.backgroundPositionX = 'center';
            frontpage.style.backgroundAttachment = 'fixed';
            frontpage.style.backgroundBlendMode = 'lighten';
            frontpage.style.animation = 'opacityTitle';
            frontpage.style.animationDuration = '2s';
            
            document.getElementById('welcometext').style.visibility = 'visible';
        }
    `]],
    plugins: [
        katexPlugin(),
        '@vuepress/plugin-register-components',
        {
          componentsDir: path.resolve(__dirname, './components'),
        },
    ],
    alias: {
        '@theme/HomeFooter.vue': path.resolve(__dirname, './components/MyHomeFooter.vue'),
        '@theme/Home.vue': path.resolve(__dirname, './components/MyHome.vue'),
    },
})