/**
 * Helper condiviso per le URL del servizio immagini di Storyblok.
 *
 * Regole (identiche su server e client, nessuna dipendenza dal DOM o dal browser):
 * - le dimensioni native vengono lette dal segmento `{WIDTH}x{HEIGHT}` dell'URL Storyblok
 *   (`.../f/{spaceId}/{WIDTHxHEIGHT}/{hash}/{filename}`)
 * - i candidati del srcset sono clampati alla risoluzione nativa: mai upscale
 * - gli asset passano dal proxy `/storyblokasset` per sfruttare la cache di Cloudflare
 */

const CDN_HOST = 'https://a.storyblok.com';
const ASSET_PROXY = '/storyblokasset';
const CANDIDATE_WIDTHS = [640, 960, 1280, 1920, 2560];

/** Oltre questa larghezza il costo di decodifica non ripaga il dettaglio in piu'. */
const MAX_WIDTH = 2560;

export interface StoryblokImageInfo {
    /** Path base senza segmento `/m/`, gia' passato dal proxy. */
    base: string;
    isSvg: boolean;
    /** Larghezza nativa del sorgente, `null` se non deducibile dall'URL. */
    naturalWidth: number | null;
    naturalHeight: number | null;
}

export interface StoryblokImageAttrs {
    src: string;
    srcset?: string;
    sizes?: string;
    width?: number;
    height?: number;
}

const normalizeHost = (filename: string) =>
    filename.replace('s3.amazonaws.com/a.storyblok.com', 'a.storyblok.com');

/** Legge un URL asset Storyblok, in qualunque forma arrivi (CDN, S3, gia' proxato, gia' con `/m/`). */
export const parseStoryblokImage = (filename?: string | null): StoryblokImageInfo | null => {
    if (!filename) return null;

    const [rawPath] = normalizeHost(filename).split('?');
    const isSvg = rawPath.toLowerCase().endsWith('.svg');

    // rimuove un eventuale segmento di trasformazione gia' presente (`/m/...`)
    const path = rawPath.replace(/\/m\/.*$/, '');
    const base = path.startsWith(CDN_HOST) ? path.replace(CDN_HOST, ASSET_PROXY) : path;

    const dimensions = path.match(/\/(\d+)x(\d+)\//);

    return {
        base: isSvg ? rawPath : base,
        isSvg,
        naturalWidth: dimensions ? Number(dimensions[1]) : null,
        naturalHeight: dimensions ? Number(dimensions[2]) : null,
    };
};

/** Variante WebP a larghezza fissa; l'altezza `0` lascia a Storyblok il rapporto d'aspetto. */
const variantUrl = (base: string, width: number) =>
    `${base}/m/${width}x0/filters:format(webp)`;

/**
 * Larghezze candidate, clampate alla risoluzione nativa e a MAX_WIDTH.
 * Include sempre il tetto effettivo, cosi' un sorgente da 1254px produce anche `1254w`.
 */
const candidateWidths = (naturalWidth: number | null): number[] => {
    const ceiling = Math.min(naturalWidth ?? MAX_WIDTH, MAX_WIDTH);
    const widths = CANDIDATE_WIDTHS.filter(w => w < ceiling);
    widths.push(ceiling);
    return widths;
};

/**
 * Attributi pronti per il tag `<img>`: `src`, `srcset` con descrittori `w`, `sizes`
 * e le dimensioni intrinseche (che evitano il CLS).
 */
export const useStoryblokImage = (
    filename?: string | null,
    sizes: string = '100vw',
): StoryblokImageAttrs | null => {
    const info = parseStoryblokImage(filename);
    if (!info) return null;

    if (info.isSvg) {
        return {
            src: info.base,
            width: info.naturalWidth ?? undefined,
            height: info.naturalHeight ?? undefined,
        };
    }

    const widths = candidateWidths(info.naturalWidth);
    const largest = widths[widths.length - 1]!;

    return {
        src: variantUrl(info.base, largest),
        srcset: widths.map(w => `${variantUrl(info.base, w)} ${w}w`).join(', '),
        sizes,
        width: info.naturalWidth ?? undefined,
        height: info.naturalHeight ?? undefined,
    };
};
