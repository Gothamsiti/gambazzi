import { sendStream } from 'h3'
import { VIDEO_EXTENSIONS, copyToR2, fetchR2Object } from '../../utils/videoStorage'

/**
 * Proxy dei video Storyblok servito da R2.
 * /videoasset/f/<space>/<WxH>/<id>/<file>.<ext> rispecchia il path di a.storyblok.com; su R2 l'asset
 * sta nella root del bucket come <id>.<ext>. La prima richiesta viene servita da Storyblok e intanto
 * l'asset viene copiato su R2; da lì in poi Storyblok non viene più invocato.
 */

const PASSTHROUGH_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']
const ASSET_PATH = new RegExp(`^f/(\\d+)/[^/]+/([0-9a-f]+)/[^/]+\\.(${VIDEO_EXTENSIONS.join('|')})$`, 'i')

const sendUpstream = (event: Parameters<typeof sendStream>[0], res: Response) => {
  setResponseStatus(event, res.status)
  for (const name of PASSTHROUGH_HEADERS) {
    const value = res.headers.get(name)
    if (value) setResponseHeader(event, name, value)
  }
  if (res.ok) setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  // chiudere a mano evita il 204 che h3 applica alle risposte vuote
  if (event.method === 'HEAD' || !res.body) return event.node.res.end()
  return sendStream(event, res.body)
}

// risposta semplice invece di createError: un errore lanciato su una route non /api viene renderizzato
// dalla pagina di errore di Nuxt, dove il middleware lingua redirige a /it/videoasset/... (422 da Storyblok)
const sendStatus = (event: Parameters<typeof sendStream>[0], status: number, message: string) => {
  setResponseStatus(event, status)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return message
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return sendStatus(event, 405, 'Method not allowed')

  const path = getRouterParam(event, 'path', { decode: true })
  const match = path?.match(ASSET_PATH)
  const { storyblokSpaceId } = useRuntimeConfig()
  if (!path || !match || (storyblokSpaceId && match[1] !== String(storyblokSpaceId))) {
    return sendStatus(event, 404, 'Not found')
  }

  const range = getRequestHeader(event, 'range')
  const key = `${match[2]}.${match[3]!.toLowerCase()}`

  const stored = await fetchR2Object(key, { method: event.method, range }).catch((error) => {
    console.error(`[videoasset] lettura R2 di ${key} fallita:`, error?.message || error)
    return null
  })
  // 200/206 dal bucket, oppure 416 su un Range non valido: in ogni caso l'oggetto esiste
  if (stored && (stored.ok || stored.status === 416)) return sendUpstream(event, stored)

  const sourceUrl = `https://a.storyblok.com/${path.split('/').map(encodeURIComponent).join('/')}`
  // copia solo se R2 ha risposto 404: su altri errori (credenziali, rete) non ha senso riprovare a ogni richiesta
  if (stored?.status === 404) event.waitUntil(copyToR2(key, sourceUrl))

  const source = await fetch(sourceUrl, { method: event.method, headers: range ? { Range: range } : undefined }).catch(() => null)
  if (!source) return sendStatus(event, 502, 'Bad gateway')
  return sendUpstream(event, source)
})
