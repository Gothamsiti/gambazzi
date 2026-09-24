<template lang="pug">
.BodyProgressSlide(ref="$el" :class="blok.class" :style="{'--slides': blok.slides.length, '--speed': speed || 1}")
    .pin-wrap.backgrounds
        .background(v-for="slide in blok.slides" :key="slide._uid" :class="{active: slide._uid === currentSlideUid}")
            ImageItem.SimpleImage(:blok="slide.backgroundImage" sizes="(max-width: 700px) 100vw, 50vw")
    .progress-bar(v-if="blok.showProgress")
        .barcontainer
            .bars
                .bar(v-for="(slide, i) in blok.slides" :key="`bars-${slide._uid}`" :class="{active: slide._uid === currentSlideUid}")
                    .baractive(:style="{width: _barFill(i) + '%'}")
    .sections
        .container
            .section(v-for="slide in blok.slides" :key="`section-${slide._uid}`" :class="[{active: slide._uid === currentSlideUid}, slide.class]")
                p.title
                    span {{ slide.title }}
                .text
                    StoryblokRichText(:document="slide.text" :components="richTextComponents")
</template>
<script setup>
    import {gsap} from "gsap";
    import {ScrollTrigger} from "gsap/ScrollTrigger";
    import {SplitText} from "gsap/SplitText";
    import RichTextImage from '~/storyblok/system/RichTextImage.vue';
    const {blok} = defineProps(["blok"]);
    const richTextComponents = {image: RichTextImage};
    provideRichTextImageConfig(() => ({sizes: '(max-width: 800px) 60vw, 44vw'}));
    const $el = ref();
    let scrollTriggerInstance;
    const currentSlideUid = ref(blok.slides[0]?._uid);
    const speed = ref(1);
    const progress = ref(0);

    const _barFill = (i) => {
        const localProgress = progress.value * blok.slides.length - i;
        return Math.min(Math.max(localProgress, 0), 1) * 100;
    };

    onMounted(() => {
        nextTick(() => {
            $el.value.querySelectorAll(".section .text > *").forEach((el) => {
                const split = new SplitText(el, {type: "lines",mask: "lines",linesClass: "line", aria: "none"});
                gsap.set(split.lines, {yPercent: 110});
            });
            scrollTriggerInstance = ScrollTrigger.create({
                trigger: $el.value,
                start: "top top",
                end: `bottom bottom`,
                scrub: true,
                onUpdate: (self) => {
                    progress.value = self.progress;
                    const slideIndex = Math.floor((progress.value+.25) * (blok.slides.length-1)) % blok.slides.length;
                    currentSlideUid.value = blok.slides[slideIndex]?._uid;
                },
            });
        });
    });

    onUnmounted(() => {
        scrollTriggerInstance?.kill();
    });
</script>
<style lang="scss">
.BodyProgressSlide{
    color:white;
    width:100%;
    position: relative;
    height: calc(var(--slides) * var(--speed) * 100vh);
    height: calc(var(--slides) * var(--speed) * 100dvh);
}
</style>
