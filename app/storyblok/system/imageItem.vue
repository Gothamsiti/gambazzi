<template lang="pug">
.imageItem(v-if="isSvg" :class="[sizeMode, 'imageItem--svg']" :role="alt ? 'img' : undefined" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : 'true'" :title="title" v-html="svg")
.imageItem(v-else :class="sizeMode")
    img(
        v-if="image"
        :src="image.src"
        :srcset="image.srcset"
        :sizes="image.sizes"
        :width="image.width"
        :height="image.height"
        :alt="alt"
        :title="title"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'low'"
        decoding="async"
    )
</template>
<script setup>
    const { blok, sizeMode, sizes, priority } = defineProps({
        blok: {type: Object, default: null},
        sizeMode: {type: String, default: undefined},
        sizes: {type: String, default: '100vw'},
        priority: {type: Boolean, default: false},
    });

    const { $__svg } = useNuxtApp();
    const isSvg = computed(() => /\.svg(\?|$)/i.test(blok?.filename || ''));
    // l'async data serve solo alle SVG da inlineare: per le altre immagini aggiungerebbe al payload
    // una voce `svg:<url>` con valore null e un fetch vuoto in SSR
    const { data: svg } = isSvg.value
        ? useAsyncData(() => `svg:${blok?.filename}`, () => $__svg(blok.filename))
        : { data: ref(null) };
    const image = computed(() => isSvg.value ? null : useStoryblokImage(blok?.filename, sizes));

    // senza alt su Storyblok l'immagine è trattata come decorativa: il nome del file non descrive nulla
    const alt = computed(() => blok?.alt || '')
    const title = computed(() => blok?.title || undefined)
    if(priority && !isSvg.value){
        useHead(() => {
            const img = image.value;
            if(!img?.srcset) return {};
            return {
                link: [{
                    rel: 'preload',
                    as: 'image',
                    href: img.src,
                    imagesrcset: img.srcset,
                    imagesizes: img.sizes,
                    fetchpriority: 'high',
                }],
            };
        });
    }
</script>
<style lang="scss">
.imageItem{
    display: block;
    overflow: hidden;
    position: relative;
    &--svg svg{
        width: 100%;
        height: 100%;
        display: block;
    }
    img{
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }
    &.aspect-ratio-width{
        img{
            margin: 0 auto;
            width: 100%;
            height: auto;
        }
    }
    &.aspect-ratio-height{
        img{
            margin: 0 auto;
            width: auto;
            height: 100%;
        }
    }
}
</style>