import { AwsClient } from 'aws4fetch'

/**
 * Accesso a R2 tramite API S3 firmata (aws4fetch): funziona uguale su Node e su Workers,
 * senza bisogno di un binding. Le credenziali arrivano da runtimeConfig.r2.
 */

const CONTENT_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
}

export const VIDEO_EXTENSIONS = Object.keys(CONTENT_TYPES)

export const videoContentType = (key: string) =>
  CONTENT_TYPES[key.split('.').pop()?.toLowerCase() || ''] || 'application/octet-stream'

let client: AwsClient | undefined
let bucketUrl: string | undefined

const getR2 = () => {
  if (!client || !bucketUrl) {
    const { accessKey, secretKey, bucket, endpoint } = useRuntimeConfig().r2
    if (!accessKey || !secretKey || !endpoint) {
      throw new Error('R2 non configurato (R2_ACCESS_KEY, R2_SECRET_KEY, R2_ENDPOINT)')
    }
    client = new AwsClient({ accessKeyId: accessKey, secretAccessKey: secretKey, service: 's3', region: 'auto' })
    // R2_ENDPOINT può contenere già il bucket nel path oppure no
    const base = endpoint.replace(/\/+$/, '')
    bucketUrl = new URL(base).pathname.split('/').filter(Boolean).length ? base : `${base}/${bucket}`
  }
  return { client, bucketUrl }
}

const objectUrl = (key: string) =>
  `${getR2().bucketUrl}/${key.split('/').map(encodeURIComponent).join('/')}`

/** GET/HEAD di un oggetto su R2, con eventuale Range inoltrato così com'è. Async così anche la config mancante diventa una rejection. */
export const fetchR2Object = async (key: string, { method = 'GET', range }: { method?: string, range?: string } = {}) =>
  getR2().client.fetch(objectUrl(key), {
    method,
    headers: range ? { Range: range } : undefined,
  })

const inflight = new Map<string, Promise<void>>()

/**
 * R2 rifiuta le PUT senza Content-Length. Su Workers un body in streaming lo ottiene solo passando
 * da FixedLengthStream, che lo inoltra nativamente senza tenerlo in memoria; su Node basta l'header.
 */
const withKnownLength = (body: ReadableStream, length: number) => {
  const Fixed = (globalThis as { FixedLengthStream?: new (length: number) => TransformStream }).FixedLengthStream
  if (!Fixed) return body
  const { readable, writable } = new Fixed(length)
  // un errore sulla sorgente arriva comunque alla PUT attraverso readable
  body.pipeTo(writable).catch(() => {})
  return readable
}

/**
 * Copia l'asset dalla sorgente su R2 in streaming: il video non viene mai caricato in memoria,
 * quindi più copie in parallelo nello stesso isolate non si avvicinano al limite di 128 MB.
 * Le copie concorrenti della stessa chiave nello stesso isolate vengono deduplicate;
 * tra isolate diversi al massimo si riscrive lo stesso oggetto, che è innocuo.
 */
export const copyToR2 = (key: string, sourceUrl: string) => {
  const pending = inflight.get(key)
  if (pending) return pending

  const task = (async () => {
    const source = await fetch(sourceUrl)
    if (!source.ok || !source.body) throw new Error(`sorgente ${source.status}`)
    const length = Number(source.headers.get('content-length'))
    if (!length) {
      await source.body.cancel()
      throw new Error('sorgente senza Content-Length')
    }

    // si firma senza body: con UNSIGNED-PAYLOAD la firma non dipende dal contenuto e lo SHA-256 del video non va calcolato
    const signed = await getR2().client.sign(objectUrl(key), {
      method: 'PUT',
      headers: {
        'Content-Type': source.headers.get('content-type') || videoContentType(key),
        'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      },
    })
    const headers = new Headers(signed.headers)
    headers.set('Content-Length', String(length))

    const res = await fetch(signed.url, {
      method: 'PUT',
      headers,
      body: withKnownLength(source.body, length),
      duplex: 'half',
    } as RequestInit)
    if (!res.ok) throw new Error(`PUT R2 ${res.status} ${await res.text()}`)
  })()
    .catch((error) => console.error(`[videoStorage] copia di ${key} fallita:`, error?.message || error))
    .finally(() => inflight.delete(key))

  inflight.set(key, task)
  return task
}
