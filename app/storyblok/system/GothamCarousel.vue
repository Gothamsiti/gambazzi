<template lang="pug">
.GothamCarousel(data-slot="root")
    .GothamCarousel__viewport(ref="viewport" data-slot="viewport")
        .GothamCarousel__container(data-slot="container" :class="ui.container")
            .GothamCarousel__item(
                v-for="(item, index) in items"
                :key="index"
                data-slot="item"
                :class="ui.item"
            )
                slot(:item="item" :index="index")
    template(v-if="arrows")
        button(
            type="button"
            data-slot="prev"
            :disabled="!canScrollPrev"
            v-bind="prev"
            @click="scrollPrev"
        )
            Icon(v-if="prevIcon" :name="prevIcon")
        button(
            type="button"
            data-slot="next"
            :disabled="!canScrollNext"
            v-bind="next"
            @click="scrollNext"
        )
            Icon(v-if="nextIcon" :name="nextIcon")
    .GothamCarousel__dots(v-if="dots" data-slot="dots")
        button(
            v-for="(snap, index) in snaps"
            :key="index"
            type="button"
            data-slot="dot"
            :data-state="index === selected ? 'active' : undefined"
            :aria-label="String(index + 1)"
            @click="scrollTo(index)"
        )
</template>
<script setup>
    // Sostituisce UCarousel di @nuxt/ui, che costava ~10ms di CPU per render in SSR (15% del totale)
    // pur essendo usato solo qui. Gli attributi data-slot/data-state replicano quelli di @nuxt/ui,
    // così le SCSS dei componenti che lo usano restano valide senza modifiche.
    const props = defineProps({
        items: { type: Array, default: () => [] },
        loop: { type: Boolean, default: false },
        arrows: { type: Boolean, default: false },
        dots: { type: Boolean, default: false },
        dragFree: { type: Boolean, default: false },
        watchDrag: { type: [Boolean, Function], default: true },
        wheelGestures: { type: Boolean, default: false },
        autoScroll: { type: [Object, Boolean], default: false },
        align: { type: String, default: 'start' },
        prevIcon: { type: String, default: undefined },
        nextIcon: { type: String, default: undefined },
        prev: { type: Object, default: () => ({}) },
        next: { type: Object, default: () => ({}) },
        ui: { type: Object, default: () => ({}) },
    });

    const viewport = useTemplateRef('viewport');

    // Un pallino per slide finché embla non riporta gli snap reali: server e client producono
    // lo stesso markup, quindi nessun mismatch di idratazione.
    const snaps = ref(props.items.map((_, index) => index));
    const selected = ref(0);
    // Frecce disabilitate finché embla non è pronto: senza JS restano inerti, ed è il caso
    // che le SCSS esistenti gestiscono già con :has([data-slot="prev"]:disabled).
    const canScrollPrev = ref(false);
    const canScrollNext = ref(false);

    let embla = null;

    const scrollPrev = () => embla?.scrollPrev();
    const scrollNext = () => embla?.scrollNext();
    const scrollTo = index => embla?.scrollTo(index);

    const sync = () => {
        if (!embla) return;
        snaps.value = embla.scrollSnapList().map((_, index) => index);
        selected.value = embla.selectedScrollSnap();
        canScrollPrev.value = embla.canScrollPrev();
        canScrollNext.value = embla.canScrollNext();
    };

    const loadPlugins = async () => {
        const plugins = [];
        if (props.wheelGestures) {
            const { WheelGesturesPlugin } = await import('embla-carousel-wheel-gestures');
            plugins.push(WheelGesturesPlugin());
        }
        if (props.autoScroll) {
            const { default: AutoScroll } = await import('embla-carousel-auto-scroll');
            plugins.push(AutoScroll(typeof props.autoScroll === 'object' ? props.autoScroll : {}));
        }
        return plugins;
    };

    onMounted(async () => {
        if (!viewport.value || !props.items.length) return;
        // embla e i suoi plugin sono importati solo a runtime lato client: non finiscono nel bundle SSR.
        const [{ default: EmblaCarousel }, plugins] = await Promise.all([
            import('embla-carousel'),
            loadPlugins(),
        ]);
        // Il componente può essere smontato mentre gli import sono in volo.
        if (!viewport.value) return;
        embla = EmblaCarousel(
            viewport.value,
            {
                loop: props.loop,
                dragFree: props.dragFree,
                watchDrag: props.watchDrag,
                align: props.align,
            },
            plugins,
        );
        embla.on('select', sync).on('reInit', sync);
        sync();
    });

    onBeforeUnmount(() => {
        embla?.destroy();
        embla = null;
    });
</script>
<style lang="scss">
.GothamCarousel{
    // Base minima: item e spaziature restano a carico di chi usa il componente,
    // esattamente come avveniva con UCarousel.
    [data-slot="viewport"]{
        overflow: hidden;
    }
    [data-slot="container"]{
        display: flex;
    }
}
</style>
