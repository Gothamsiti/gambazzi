<template lang="pug">
.BodyMarqueeImages(:class="[blok.class, ...mw.classes]" :style="mw.style")
    GothamCarousel(
        v-slot="{ item, index }"
        loop
        wheel-gestures
        drag-free
        :items="assets"
        :auto-scroll="{ speed: 1, startDelay: 0, playOnInit: true, stopOnInteraction: false, stopOnMouseEnter: false }"
        :ui="{ container: 'BodyHorizontalScrollImages__container', item: 'BodyHorizontalScrollImages__item' }"
    )
        //- le copie aggiunte per riempire il loop non vanno rilette dagli screen reader
        imageItem(
            :aria-hidden="index >= (blok.images?.length || 0) ? 'true' : undefined"
            :blok="item"
            :sizeMode="'aspect-ratio-height'"
            sizes="(max-width: 768px) 80vw, 40vw"
        )
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
    const mw = useMwClass(() => blok.class);
    const assets = computed(() => {
        const items = blok.images || [];
        if (!items.length) return [];
        const minCount = 10;
        if (items.length >= minCount) return items;
        const times = Math.ceil(minCount / items.length);
        return Array(times).fill(items).flat();
    });
</script>
<style lang="scss">
.BodyMarqueeImages{
    width: 100%;
    height: 100%;
    *{
        height: 100%;
    }

    .BodyHorizontalScrollImages__container{
        display: flex;
        flex-direction: row;
        gap: mw(1);
        padding: 0 mw(1);
        height: 100%;
    }

    .BodyHorizontalScrollImages__item{
        // gli !important servivano a scavalcare il basis-full di UCarousel; senza @nuxt/ui
        // l'item non ha stili di base, quindi va dichiarata la larghezza automatica
        flex: 0 0 auto;
        min-width: auto;
        padding-inline-start: 0;
    }

    .BodyHorizontalScrollImages__item .imageItem{
        flex: 0 0 auto;
        width: auto;
        height: 100%;
        img{
            object-fit: cover;
        }
    }
    @include media(768){
        height: mw(38) !important;
    }
    @include media(480){
        height: mw(80) !important;
        .BodyHorizontalScrollImages__container{
            gap : mw(2);
            padding: 0 mw(2);
        }
        .BodyHorizontalScrollImages__item .imageItem{
            height: mw(80);
        }
    }
}
</style>
