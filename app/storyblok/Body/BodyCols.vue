<template lang="pug">
.BodyColsWrap(v-if="!blok.hide" :class="{ 'BodyColsWrap--scroll': isHorizontalScroll }")
    NuxtLink.BodyCols(v-if="blok?.link?.cached_url && !sbEditor" ref="scrollRoot" :to="$__url(blok?.link?.cached_url)" :id="blok.id" :class="['cols-'+blok.cols.length, blok.flexClass, ...mw.classes]" :style="bgStyle")
        BodyColsContent(:blok="blok" :noeditable="noeditable" @proceed="emit('proceed')")
    section.BodyCols(v-else ref="scrollRoot" :id="blok.id" :class="['cols-'+blok.cols.length, blok.flexClass, ...mw.classes]" :style="bgStyle")
        BodyColsContent(:blok="blok" :noeditable="noeditable" @proceed="emit('proceed')")
    .BodyCols__scrollbar(v-if="isHorizontalScroll && showScrollbar" ref="trackRef" @click="onTrackClick" @pointerdown="onTrackPointerDown")
        .BodyCols__scrollbar-thumb(:style="thumbStyle" @pointerdown="onThumbPointerDown" @click.stop)
    .BodyCols__arrows(v-if="isHorizontalScroll && showScrollbar" :style="arrowsStyle")
        .BodyCols__arrow--left(:class="{ 'is-disabled': !canScrollLeft }" @click="moveScroll(-1)")
            Icon(:name="'gotham:arrow-down'")
        .BodyCols__arrow--right(:class="{ 'is-disabled': !canScrollRight }" @click="moveScroll(1)")
            Icon(:name="'gotham:arrow-down'")
</template>
<script setup>
    const { sbEditor } = useStoryblokEditor();
    const {blok}=defineProps(['blok', 'noeditable', 'story', 'rels']);
    const mw = useMwClass(blok.customClass);
    const isHorizontalScroll = computed(() => mw.classes.includes('horizontalScroll'));
    const emit = defineEmits(['proceed']);
    const toUrl = (filename) => {
        const base = filename.replace('https://a.storyblok.com', '/storyblokasset');
        const filters = [];
        if (blok.webp) filters.push('format(webp)');
        if (blok.quality) filters.push(`quality(${blok.quality})`);
        const transform = filters.length ? `/m/filters:${filters.join(':')}` : '';
        return `url('${base}${transform}')`;
    };
    const booted = ref(false);
    const bgStyle = computed(() => ({
        backgroundColor: blok.backgroundColor,
        color: blok.color,
        '--bg-image': blok.backgroundImage?.filename ? toUrl(blok.backgroundImage.filename) : 'none',
        '--bg-image-vertical': blok.backgroundImageVertical?.filename
            ? toUrl(blok.backgroundImageVertical.filename)
            : (blok.backgroundImage?.filename ? toUrl(blok.backgroundImage.filename) : 'none'),
        ...mw.style,
    }));
    const scrollRoot = ref(null);
    const trackRef = ref(null);
    const {
        showScrollbar,
        thumbStyle,
        onThumbPointerDown,
        onTrackPointerDown,
        onTrackClick,
        getScrollEl,
        moveScroll,
        canScrollLeft,
        canScrollRight,
    } = useHorizontalScrollbar({
        scrollRoot,
        trackRef,
        enabled: isHorizontalScroll,
    });

    const scrollEl = computed(() => getScrollEl());

    const arrowsRect = ref({ top: 0, left: 0, width: 0, height: 0 });
    const arrowsStyle = computed(() => ({
        top: arrowsRect.value.top + 'px',
        left: arrowsRect.value.left + 'px',
        width: arrowsRect.value.width + 'px',
        height: arrowsRect.value.height + 'px',
    }));

    const updateArrowsRect = () => {
        const el = scrollEl.value;
        if (!el) return;
        arrowsRect.value = {
            top: el.offsetTop,
            left: el.offsetLeft,
            width: el.offsetWidth,
            height: el.offsetHeight,
        };
    };

    let arrowsRafPending = false;
    const requestUpdateArrowsRect = () => {
        if (arrowsRafPending) return;
        arrowsRafPending = true;
        requestAnimationFrame(() => {
            arrowsRafPending = false;
            updateArrowsRect();
        });
    };

    let scrollElResizeObserver;
    const observeScrollEl = (el) => {
        scrollElResizeObserver?.disconnect();
        if (!el || typeof ResizeObserver === 'undefined') return;
        scrollElResizeObserver = new ResizeObserver(requestUpdateArrowsRect);
        scrollElResizeObserver.observe(el);
    };

    watch(scrollEl, (el) => {
        updateArrowsRect();
        observeScrollEl(el);
    }, { immediate: true });

    let revertAnimations;
    onMounted(() => {
        const el = scrollEl.value;
        if (el) {
            nextTick(() => {
                revertAnimations = useAnimations(el, blok, blok.animations, undefined, () => booted.value = true);
            });
        } else {
            booted.value = true;
        }
        window.addEventListener('resize', requestUpdateArrowsRect);
    });
    onUnmounted(() => {
        revertAnimations?.();
        scrollElResizeObserver?.disconnect();
        window.removeEventListener('resize', requestUpdateArrowsRect);
    });
</script>
<style lang="scss">
@use "sass:color";

.BodyColsWrap{
    display: contents;
    &--scroll{
        display: block;
        position: relative;
    }
}
.BodyCols{
    position: relative;
    display: flex;
    box-sizing: border-box;
    padding: 0;
    background-image: var(--bg-image, none);
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    @include media(550){
        background-image: var(--bg-image-vertical, var(--bg-image, none));
    }
    text-decoration: none;
    &:has(>.sticky){
        align-items: flex-start;
    }
    @include media(980){
        &:not(.no-980-column):not(.horizontalScroll){
            flex-direction: column;
        }
    }
    &.flex-wrap{
        flex-wrap: wrap;
    }
    &.vertical{
        display: flex !important;
        flex-direction: column;
    }
    &.align-items-center{
        align-items: center;
    }
    &.align-items-start{
        align-items: flex-start;
    }
    &.align-items-end{
        align-items: flex-end;
    }
    &.justify-content-space-between{
        justify-content: space-between;
    }
    &.justify-content-center{
        justify-content: center;
    }
    &.justify-content-start{
        justify-content: flex-start;
    }
    &.justify-content-end{
        justify-content: flex-end;
    }
    &.horizontalScroll{
        overflow-x: auto;
        overflow-y: hidden;
        flex-wrap: nowrap;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: mw(1) !important;
        align-items: flex-start;
        position: relative;
        z-index: 1;
        &::-webkit-scrollbar{
            display: none;
        }
        >*{
            box-sizing: border-box;
            *{
                max-width:100%;
            }
        }
    }
    &__scrollbar{
        position: absolute;
        left:0;
        right:0;
        bottom:0rem;
        height: 1px;
        border-radius: 2px;
        background-color: rgba($greyLight, 0.3);
        cursor: pointer;
        z-index: 2;
    }
    &__scrollbar-thumb{
        position: absolute;
        top: 0;
        height: .6rem;
        min-width: 24px;
        border-radius: 9rem;
        background-color: color.adjust($greyLight, $lightness: 10%);
        transform: translateY(-50%);
        transition: height 0.2s ease;
        cursor: grab;
        &:active{
            cursor: grabbing;
        }
        &:hover{
            height: 2rem;
        }
    }
    &__arrows{
        position: absolute;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        z-index: 3;
        overflow: visible;
    }
    &__arrow--left,
    &__arrow--right{
        cursor: pointer;
        pointer-events: all;
        width: max(mw(2), 2rem);
        height: max(mw(2), 2rem);
        background: #000000af;
        backdrop-filter: blur(4px);
        position: sticky;
        top: mw(8);
        margin-top: mw(6);
        margin-bottom: mw(4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color $dt $de, opacity $dt $de;
        &.is-disabled{
            opacity: .1;
            pointer-events: none;
        }
        .iconify{
            font-size: max( mw(1), 1rem);
            color:$white;
        }
        &:hover{
            background: #000000;
        }
    }
    &__arrow--left{
        margin-left: mw(-1);
        .iconify{
            transform: rotate(90deg);
        }
    }
    &__arrow--right{
        margin-right: mw(-1);
        .iconify{
            transform: rotate(-90deg);
        }
    }
    &.marqueeImagesHolder{
        position: relative;
        background:$white;
        padding:mw(10) 0; 
        color : $black;
        overflow: hidden;
        @include media(550){
            padding:mw(2); 
            gap: mw(2);
        }
        >.BodyColsWrap{
            position: absolute;
            top:0;
            z-index: 2;
            @include media(550){
                position: relative;
                top:auto;
            }
            >.BodyCols{   
                position: absolute;
                top:mw(10);
                z-index: 2;
                flex-direction: column;
                justify-content: space-between;
                padding:0 mw(1);
                background:$white;
                height: mw(30);
                width: mw(25);
                left: mw(10);
                @include media(980){
                    width: mw(35);
                }
                @include media(550){
                    position: relative;
                    top:auto;
                    left: auto;
                    width: auto;
                    height: auto !important;
                    gap:mw(2);
                }
            }
        }
        >.BodyMarqueeImages{
            position: relative;
            z-index: 1;
            width: 100%;
            height: mw(30);
        }
    }
    &.justify-content-start-860{
        @include media(860){
            justify-content: flex-start;
        }
    }
    &.video-background{
        *{
            z-index: 2;
        }
        >.SimpleVideo{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1 !important;
            &::after{
                display: block;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                content: '';
                background: rgba(0, 0, 0, 0.5);
                z-index: 3;
                background: linear-gradient(180deg, rgba(51, 47, 47, 0.7) 0%, rgba(51, 47, 47, 0.2) 20.67%, rgba(51, 47, 47, 0.5) 100%);
            }
        }
    }
}
</style>
