import { purgeNginxCache } from '../../utils/nginxCache'

interface NitroPurgeResult {
  purged: boolean
  bases: string[]
  keys: number
  errors?: string[]
}

interface LinksPurgeResult {
  purged: boolean
  error?: string
}

/** Basi di storage nitro da svuotare: la cache delle route/funzioni cachate. */
const NITRO_CACHE_BASES = ['cache']

const purgeNitroCache = async (): Promise<NitroPurgeResult> => {
  const result: NitroPurgeResult = { purged: true, bases: NITRO_CACHE_BASES, keys: 0 }
  const errors: string[] = []

  for (const base of NITRO_CACHE_BASES) {
    const storage = useStorage(base)
    let keys: string[] = []
    try {
      keys = await storage.getKeys()
    }
    catch (error: any) {
      errors.push(`${base}: ${error?.message || 'cannot read keys'}`)
      continue
    }
    // rimozione sequenziale: in cluster/fs driver il Promise.all lascia chiavi orfane
    for (const key of keys) {
      try {
        await storage.removeItem(key, { removeMeta: true })
        result.keys++
      }
      catch (error: any) {
        errors.push(`${base}:${key}: ${error?.message || 'cannot remove'}`)
      }
    }
  }

  if (errors.length) {
    result.purged = false
    result.errors = errors
  }
  return result
}

/**
 * La whitelist degli slug (`linksList` in gothamstoryblok) e' una variabile di modulo
 * senza scadenza: svuotare lo storage nitro non la tocca, quindi una pagina appena
 * pubblicata resterebbe un 404 fino al riavvio del processo. `clearCache` e' l'unico
 * endpoint che chiama `clearLinks()`, e in fork mode (una sola istanza pm2) la
 * chiamata interna colpisce per forza il processo giusto.
 * Nota: quell'endpoint svuota anche `cache:storyblok:_` e lancia il purge Cloudflare,
 * lavoro in parte gia' fatto qui sopra ma innocuo.
 */
const purgeLinksMemo = async (): Promise<LinksPurgeResult> => {
  try {
    await $fetch('/api/storyblok/clearCache')
    return { purged: true }
  }
  catch (error: any) {
    return { purged: false, error: error?.message || 'cannot clear links memo' }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.cachePurgeToken

  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'Cache purge disabled (missing CACHE_PURGE_TOKEN)' })
  }

  const query = getQuery(event)
  const body = isMethod(event, 'POST') ? await readBody(event).catch(() => ({})) : {}
  const provided = getHeader(event, 'x-purge-token') || query.token || body?.token

  if (provided !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const target = String(query.target || body?.target || 'all')
  if (!['all', 'nginx', 'nitro'].includes(target)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid target (all|nginx|nitro)' })
  }

  setResponseHeader(event, 'cache-control', 'no-store')

  const response: Record<string, unknown> = { target }

  if (target === 'all' || target === 'nitro') {
    // prima lo storage, poi il memo: cosi' il refetch di /api/storyblok/links
    // non ripesca l'entry cachata che abbiamo appena buttato via.
    response.nitro = await purgeNitroCache()
    response.links = await purgeLinksMemo()
  }
  if (target === 'all' || target === 'nginx') {
    response.nginx = await purgeNginxCache()
  }

  const failed = Object.values(response).some(r => typeof r === 'object' && r !== null && (r as any).purged === false)
  response.ok = !failed
  if (failed) setResponseStatus(event, 207)

  console.log('[cache] purge', JSON.stringify(response))
  return response
})
