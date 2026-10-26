<template lang="pug">
.BodyColsWrap(v-if="!blok.hide" :class="{ 'BodyColsWrap--scroll': isHorizontalScroll }")
    NuxtLink.BodyCols(v-if="blok?.link?.cached_url && !sbEditor" ref="scrollRoot" :to="$__url(blok?.link?.cached_url)" :id="blok.id" :class="['cols-'+blok.cols.length, blok.flexClass, ...mw.classes]" :style="bgStyle")
        BodyColsContent(:blok="blok" :noeditable="noeditable" @proceed="emit('proceed')")
    section.BodyCols(v-else ref="scrollRoot" :id="blok.id" :class="['cols-'+blok.cols.length, blok.flexClass, ...mw.classes]" :style="bgStyle")
        BodyColsContent(:blok="blok" :noeditable="noeditable" @proceed="emit('proceed')")
    .BodyCols__scrollbar(v-if="isHorizontalScroll && showScrollbar" ref="trackRef" aria-hidden="true" @click="onTrackClick" @pointerdown="onTrackPointerDown")
        .BodyCols__scrollbar-thumb(:style="thumbStyle" @pointerdown="onThumbPointerDown" @click.stop)
    .BodyCols__arrows(v-if="isHorizontalScroll && showArrows" :style="arrowsStyle")
        button.BodyCols__arrow--left(type="button" :class="{ 'is-disabled': !canScrollLeft }" :aria-disabled="!canScrollLeft" @click="moveScroll(-1)" :aria-label="label('previous', 'Precedente')")
            Icon(:name="'gotham:arrow-right'" aria-hidden="true")
        button.BodyCols__arrow--right(type="button" :class="{ 'is-disabled': !canScrollRight }" :aria-disabled="!canScrollRight" @click="moveScroll(1)" :aria-label="label('next', 'Successivo')")
            Icon(:name="'gotham:arrow-right'" aria-hidden="true")
</template>
<script setup>
    import { gsap } from "gsap";
    const { sbEditor } = useStoryblokEditor();
    const { $__ } = useNuxtApp();
    // finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
    const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };
    const {blok}=defineProps(['blok', 'noeditable', 'story', 'rels']);
    const mw = useMwClass(() => blok.customClass);
    const isHorizontalScroll = computed(() => mw.classes.includes('horizontalScroll'));
    const emit = defineEmits(['proceed']);
    const toUrl = (filename) => `url('${storyblokBackgroundUrl(filename, { webp: blok.webp !== false, quality: blok.quality })}')`;
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
        showArrows,
        thumbStyle,
        arrowsStyle,
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
        arrows: true,
    });

    let revertAnimations;
    onMounted(() => {
        const el = getScrollEl();
        if (el) {
            nextTick(() => {
                revertAnimations = useAnimations(el, blok, blok.animations, undefined, () => booted.value = true);
            });
        } else {
            booted.value = true;
        }
        if(blok.id == "page-head-root"){
            const $el = scrollRoot?.value;
            const video = $el.querySelector('.SimpleVideo');
            const videoElement = video?.querySelector('video');
            if(videoElement && video ){
                const pageHead = document.querySelector('#page-head');
                const casanova = document.querySelector('#page-head-casanova');
                const copy = document.querySelectorAll('#page-head-copy *');
                const tl = gsap.timeline();
                tl.fromTo(casanova, { y:40, opacity: 0 }, { y:0, opacity: 1, duration: 1 });
                tl.fromTo(copy, { y:40, opacity: 0 }, { y:0, opacity: 1, duration: 1,onComplete: () => { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) videoElement.play(); } }, "-=.5");
                tl.to(video, { opacity: 1, duration: 1 });
                tl.to(videoElement, { scale: 1, duration: 1 }, "-=1");
                tl.fromTo(pageHead, { color: '#000000' }, { color: '#ffffff', duration: 1 }, "-=1");
            }
        }
    });
    onUnmounted(() => {
        revertAnimations?.();
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
        align-items: flex-start;
        position: relative;
        z-index: 1;
        // spazio per la scrollbar custom, solo quando c'è
        &:has(~ .BodyCols__scrollbar){
            padding-bottom: mw(1) !important;
            @include media(550){
                padding-bottom: mw(3) !important;
            }
        }
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
        // frecce in alto a destra, appoggiate sopra il bordo superiore del contenitore
        &__arrows{
            position: absolute;
            display: flex;
            justify-content: flex-end;
            gap: mw(.5);
            padding-bottom: mw(1);
            transform: translate(mw(-2), -100%);
            pointer-events: none;
            z-index: 3;
            @include media(550){
                display: none;
            }
        }
        &__arrow--left,
        &__arrow--right{
            cursor: pointer;
            padding: 0;
            border: 0;
            color: inherit;
            font: inherit;
            pointer-events: all;
            width: max(mw(4.5), 4.4rem);
            height: max(mw(4.5), 4.4rem);
            background: color.adjust($greyDark, $lightness: 10%);
            border-radius: mw(.25);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color $dt $de, opacity $dt $de;
            &.is-disabled{
                opacity: .3;
                pointer-events: none;
            }
            .iconify{
                font-size: max(mw(2), 2rem);
                color: $white;
            }
            &:hover{
                background: color.adjust($greyDark, $lightness: 20%);
            }
        }
        &__arrow--left .iconify{
            transform: rotate(180deg);
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

    &#homepage-head{
        position: relative;
        align-items: flex-start;
        justify-content: flex-start;
        > .SimpleImage, > .SimpleVideo{
            width: 100%;
            height: 100vh;
            flex: 0 0 100vh;
        }
        > .SimpleImage{
            margin-top: -100vh;
        }
        > .BodySimpleText{
            left: 0;
            top: 0;
            left: 0;
            position: sticky;
            z-index: 2;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        > .SimpleVideo{
            z-index: 3;
        }
    }
}
</style>
