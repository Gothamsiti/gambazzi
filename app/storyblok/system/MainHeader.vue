<template lang="pug">
header#mainHeader(v-if="header" ref="$header" :class="[{scrolled: (scrolled && scroll.direction<=0), hide: scroll.direction>0 && scrolled}, ...mw.classes]" :style="mw.style")
    .left
        StoryblokComponent(v-for="child of header.left" :blok="child" :key="child._uid" v-editable="child")
    .center
        StoryblokComponent(v-for="child of header.center" :blok="child" :key="child._uid" v-editable="child")
    .right
        StoryblokComponent(v-for="child of header.right" :blok="child" :key="child._uid" v-editable="child")
</template>
<script setup>
    const { sizes,scroll } = useSizes();
	const { story } = await useAsyncGothamStoryblok("system/mainheader");
	const header = computed(() => {
		if (!story.value) return null;
		return story.value.content;
	});
	const mw = useMwClass(() => header.value?.class);
    const scrolled = computed(() => scroll.value.top > sizes.value.height*2);
</script>
<style lang="scss">
header#mainHeader{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: mw(2) mw(2) 0 mw(2);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    z-index: 3;
    *{
        border-color: inherit;
    }
    >*{
        display: flex;
        gap: 2px;
        &.center{
            gap:4rem;
        }
        >*{
            opacity: 1;
            transition: opacity $dt $de;
        }
    }
    &.hide{
        >*{
            >*{
                opacity: 0 !important;
                pointer-events: none;
            }
        }
    }
    @include media(1024){
        .center{
            display: none !important;
        }
    }
}
</style>