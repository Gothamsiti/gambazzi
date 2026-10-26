/**
 * Sitemap generata dalle storie Storyblok (escluse quelle in system/), come in Proima.
 * Le pagine sono servite sotto /<lingua>/<full_slug> per ogni lingua dello space (vedi languageRedirect):
 * ogni storia produce un <url> per lingua, con gli alternate hreflang verso le altre versioni.
 */

type SitemapStory = { full_slug: string, updated_at: string }
type SitemapSpace = { available_languages?: string[], default_language?: string }

export default defineCachedEventHandler(async (event) => {
  const { domain, defaultLanguage } = useRuntimeConfig()
  const [stories, space] = await Promise.all([
    $fetch<SitemapStory[]>('/api/storyblok/all', { query: { excluding_slugs: 'system/*' } }),
    $fetch<SitemapSpace>('/api/storyblok/space'),
  ])
  const fallbackLanguage = space?.default_language || defaultLanguage
  const languages = [...new Set(space?.available_languages?.length ? space.available_languages : [fallbackLanguage])]

  const urls = (Array.isArray(stories) ? stories : []).flatMap((story) => {
    const slug = story.full_slug === 'homepage' ? '' : story.full_slug
    const loc = (lang: string) => `${domain}/${lang}/${slug}`
    const alternates = languages.length > 1
      ? [...languages.map(lang => `\t\t<xhtml:link rel="alternate" hreflang="${lang}" href="${loc(lang)}"/>\n`),
          `\t\t<xhtml:link rel="alternate" hreflang="x-default" href="${loc(fallbackLanguage)}"/>\n`].join('')
      : ''
    return languages.map(lang =>
      `\t<url>\n\t\t<loc>${loc(lang)}</loc>\n\t\t<lastmod>${story.updated_at}</lastmod>\n${alternates}\t</url>`
    )
  })

  setHeader(event, 'Content-Type', 'text/xml')
  setHeader(event, 'Cache-Control', 'max-age=3600')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`
}, {
  maxAge: 60 * 60
})
