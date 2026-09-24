import type { InjectionKey, Ref } from 'vue';

/**
 * Configurazione condivisa fra un wrapper di richtext e i nodi `image` che rende.
 * Il renderer di @storyblok/richtext passa ai componenti custom solo `attrs`,
 * quindi le opzioni per call site viaggiano via provide/inject.
 */
export interface RichTextImageConfig {
    /** Valore dell'attributo `sizes` per le immagini del documento. */
    sizes: string;
    /** `src` della prima immagine, da caricare in eager quando il blocco e' above the fold. */
    eagerSrc: string | null;
}

const RICH_TEXT_IMAGE_KEY: InjectionKey<Ref<RichTextImageConfig>> = Symbol('richTextImage');

const DEFAULT_CONFIG: RichTextImageConfig = { sizes: '100vw', eagerSrc: null };

type RichTextNode = { type?: string; attrs?: { src?: string | null }; content?: RichTextNode[] };

/** Prima immagine incontrata in profondita' nel documento. */
const findFirstImageSrc = (node?: RichTextNode | null): string | null => {
    if (!node) return null;
    if (node.type === 'image' && node.attrs?.src) return node.attrs.src;
    for (const child of node.content || []) {
        const found = findFirstImageSrc(child);
        if (found) return found;
    }
    return null;
};

export interface ProvideRichTextImageOptions {
    document?: unknown;
    sizes?: string;
    /** Se `true`, la prima immagine del documento resta eager (blocco above the fold). */
    eagerFirst?: boolean;
}

export const provideRichTextImageConfig = (options: () => ProvideRichTextImageOptions) => {
    const config = computed<RichTextImageConfig>(() => {
        const { document, sizes = '100vw', eagerFirst = false } = options();
        return {
            sizes,
            eagerSrc: eagerFirst ? findFirstImageSrc(document as RichTextNode) : null,
        };
    });
    provide(RICH_TEXT_IMAGE_KEY, config);
    return config;
};

export const useRichTextImageConfig = () =>
    inject(RICH_TEXT_IMAGE_KEY, computed(() => DEFAULT_CONFIG));
