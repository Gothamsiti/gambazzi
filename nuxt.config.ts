import { homedir } from 'os'
import { join } from 'path'
import { readdirSync } from 'fs'

const isDevelopment = process.env.NODE_ENV === 'development'
const isCloudflare = Boolean(process.env.CF_PAGES)
  || (process.env.NITRO_PRESET || '').includes('cloudflare')
const iconsDir = './app/assets/icons'
const iconAliases = Object.fromEntries(
  readdirSync(iconsDir).filter(f => f.endsWith('.svg')).map(f => [f.slice(0, -4), `gotham:${f.slice(0, -4)}`])
)
const nitroCacheDir = process.env.NITRO_FS_CACHE_DIR || './.cache/nitro'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: [
    "~/assets/scss/main.scss",
  ],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/vars.scss" as *;',
        },
      },
    },
    optimizeDeps: {
      include: [
        'vue3-select-component',
        'gsap',
      ]
    },
  },
  runtimeConfig: {
    domain: process.env.SITE_URL,
    maxAge: process.env.DEFAULT_EXPIRE ? parseInt(process.env.DEFAULT_EXPIRE) : 0,
    defaultLanguage: process.env.DEFAULT_LANGUAGE,
    env: process.env.ENVIROMENT,
    cloudflare: {
      zoneID: process.env.CLOUDFLARE_ZONE_ID,
      email: process.env.CLOUDFLARE_EMAIL,
      apiKey: process.env.CLOUDFLARE_API_KEY
    },
    framesDomain: process.env.FRAMES_DOMAIN,
    cachePurgeToken: process.env.CACHE_PURGE_TOKEN,
    storyblokSpaceId: process.env.STORYBLOK_SPACE_ID,
    r2: {
      accessKey: process.env.R2_ACCESS_KEY,
      secretKey: process.env.R2_SECRET_KEY,
      bucket: process.env.R2_BUCKET,
      endpoint: process.env.R2_ENDPOINT,
    },
    nginx: {
      cacheDir: process.env.NGINX_CACHE_DIR,
      purgeCommand: process.env.NGINX_PURGE_COMMAND,
    },
    public: {
      env: process.env.ENVIROMENT,
      framesDomain: process.env.FRAMES_DOMAIN,
      framesUseLocal: process.env.FRAMES_USE_LOCAL === 'true',
      normalizeScroll: process.env.NORMALIZE_SCROLL ? process.env.NORMALIZE_SCROLL === 'true' : false,
    }
  },
  basicAuth: {
    enabled: process.env.ENVIROMENT !== 'production' && Boolean(process.env.BASIC_AUTH_USERNAME && process.env.BASIC_AUTH_PASSWORD),
    allowedRoutes: [
      "/api/.*",
    ],
    users: [
      {
        username: process.env.BASIC_AUTH_USERNAME || '',
        password: process.env.BASIC_AUTH_PASSWORD || '',
      },
    ],
  },
  modules: [
    "@storyblok/nuxt",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "gothamstoryblok",
    "gothamform",
    "@kgierke/nuxt-basic-auth"
  ],
  fonts: {
    defaults: { subsets: ['latin'] },
    families: [
      { name: 'Onest', provider: 'google', weights: [300, 700], preload: true }
    ],
  },
  icon: {
    customCollections: [
      {
        prefix: 'gotham',
        dir: iconsDir
      }
    ],
    aliases: iconAliases,
  },
  storyblok: {
    accessToken: 'nullkey'
  },
  gothamstoryblok: {
    cloudflare: {
      zoneID: process.env.CLOUDFLARE_ZONE_ID,
      apiKey: process.env.CLOUDFLARE_API_KEY
    },
    storyblok: {
      version: process.env.STORYBLOK_VERSION as 'draft' | 'published',
      key: process.env.STORYBLOK_API_KEY,
      draftKey: process.env.STORYBLOK_DRAFT_API_KEY,
    },
    cache: {
      expire: process.env.DEFAULT_EXPIRE ? parseInt(process.env.DEFAULT_EXPIRE) : 0
    },
  },
  gothamutils: {
    analytics: {
      trackingId: process.env.GOOGLE_TAG_MANAGER_ID,
    }
  },
  gothamform: {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    brevo: {
      key: process.env.BREVO_API_KEY,
    }
  },
  image: {
    provider: "storyblok",
    format: ["webm"],
    storyblok: {
      baseURL: '/storyblokasset/' // proxando gli asset possiamo sfruttare la cache di cloudflare
    },
    none: {}
  },
  nitro: {
    ...(isCloudflare
      ? {}
      : {
          storage: {
            cache: { driver: 'fsLite', base: nitroCacheDir },
          },
        }),
    routeRules: {
      '/storyblokasset/**': { proxy: 'https://a.storyblok.com/**' },
      '/api/**': { cache: false },
      '/api/cache/**': { cache: false, headers: { 'cache-control': 'no-store' } },
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: process.env.DEFAULT_LANGUAGE },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: process.env.SITE_NAME,
      link: [
        { rel: "icon", type: "shortcut icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-icon-192x192.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#38499b" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://a.storyblok.com" },
      ],
    }
  },
  devtools: { enabled: false },
  devServer: {
    https: {
      key: join(homedir(), '.certs/localhost-key.pem'),
      cert: join(homedir(), '.certs/localhost.pem'),
    },
  },
})
