// Generato a runtime perché la direttiva Sitemap richiede un URL assoluto (DOMAIN)
export default defineEventHandler((event) => {
  const { domain } = useRuntimeConfig()
  setHeader(event, 'Content-Type', 'text/plain')
  return `User-Agent: *\nDisallow:\n\nSitemap: ${domain}/sitemap.xml\n`
})
