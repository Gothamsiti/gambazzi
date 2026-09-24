import { exec } from 'node:child_process'
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface NginxPurgeResult {
  purged: boolean
  strategy: 'command' | 'filesystem'
  /** Cache directory emptied (filesystem strategy). */
  dir?: string
  /** Number of top level entries removed (filesystem strategy). */
  removed?: number
  reason?: string
}

/**
 * Svuota la cache di nginx (`proxy_cache_path`).
 *
 * Nginx open source non espone `proxy_cache_purge`, quindi l'unico modo e'
 * cancellare i file dalla directory di cache: nginx ricrea le sottocartelle
 * `levels=1:2` al primo MISS successivo, non serve reload.
 *
 * Due strategie, in ordine:
 * 1. `NGINX_PURGE_COMMAND` — comando shell (tipicamente un wrapper sudo
 *    NOPASSWD) da usare quando il processo node non puo' scrivere in
 *    /var/cache/nginx.
 * 2. cancellazione diretta del contenuto di `NGINX_CACHE_DIR`, che richiede
 *    che l'utente di pm2 abbia permessi di scrittura sulla directory.
 */
export const purgeNginxCache = async (): Promise<NginxPurgeResult> => {
  const config = useRuntimeConfig()
  const { cacheDir, purgeCommand } = config.nginx || {}

  if (purgeCommand) {
    try {
      await execAsync(purgeCommand, { timeout: 30_000 })
      return { purged: true, strategy: 'command' }
    }
    catch (error: any) {
      console.error('[cache] nginx purge command failed', error)
      return { purged: false, strategy: 'command', reason: error?.message || 'command failed' }
    }
  }

  if (!cacheDir) {
    return { purged: false, strategy: 'filesystem', reason: 'missing NGINX_CACHE_DIR' }
  }

  let entries: string[]
  try {
    entries = await readdir(cacheDir)
  }
  catch (error: any) {
    console.error('[cache] cannot read nginx cache dir', cacheDir, error)
    return { purged: false, strategy: 'filesystem', dir: cacheDir, reason: error?.code || error?.message }
  }

  let removed = 0
  for (const entry of entries) {
    try {
      await rm(join(cacheDir, entry), { recursive: true, force: true })
      removed++
    }
    catch (error: any) {
      console.error('[cache] cannot remove nginx cache entry', entry, error)
      return { purged: false, strategy: 'filesystem', dir: cacheDir, removed, reason: error?.code || error?.message }
    }
  }

  return { purged: true, strategy: 'filesystem', dir: cacheDir, removed }
}
