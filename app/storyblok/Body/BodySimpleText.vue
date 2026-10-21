<template lang="pug">
section.BodySimpleText(ref="$el" :class="[blok.class, ...mw.classes]" :style="bgStyle" :id="blok.id")
	StoryblokRichText(v-if="blok.text" :document="parsedText" :components="richTextComponents")
</template>
<script setup>
	import RichTextImage from '~/storyblok/system/RichTextImage.vue';
	const $el = ref();
	// `eagerFirst`: da attivare solo se il blocco e' above the fold (nel flusso Storyblok resta false)
	const {blok, eagerFirst} = defineProps({blok: {type: Object, required: true}, eagerFirst: {type: Boolean, default: false}});
	const richTextComponents = {image: RichTextImage};
	const mw = useMwClass(() => blok.class);
	const storyblokAssetUrlRegex = /https:\/\/a\.storyblok\.com\/f\/[^\s"')<>]+/g;

	const mapStoryblokAssetUrl = (url) => {
		const [pathPart, queryPart] = url.split("?");
		const isSvg = pathPart.toLowerCase().endsWith(".svg");
		const normalizedPath = isSvg
			? pathPart
			: pathPart.endsWith("/m/")
				? pathPart
				: `${pathPart.replace(/\/$/, "")}/m/filters:format(webp)`;
		const normalizedUrl = queryPart ? `${normalizedPath}?${queryPart}` : normalizedPath;

		return isSvg ? normalizedUrl : normalizedUrl.replace("https://a.storyblok.com", "/storyblokasset");
	};
	const booted = ref(false);
	const animationsInited = ref(false);
	const initialOpacity = computed(() => {
		return animationsInited.value ? {} : {
			opacity: (blok.animations || []).some(a =>( a.properties || []).some(p => p.key === 'opacity')) ? 0 : 1
		};
	});
	const bgStyle = computed(() => ({
		backgroundColor: blok.backgroundColor,
		color: blok.color,
		backgroundImage: blok.backgroundImage?.filename ? `url('${storyblokBackgroundUrl(blok.backgroundImage.filename)}')` : 'none',
		borderColor: blok.borderColor,
		...mw.style,
		...initialOpacity.value,
	}));

	const parsedText = computed(() => {
		if (!blok.text) return null;
		const text = JSON.stringify(blok.text);
		return JSON.parse(text.replace(storyblokAssetUrlRegex, mapStoryblokAssetUrl));
	});
	
	provideRichTextImageConfig(() => ({document: parsedText.value, eagerFirst}));

	let revertAnimations;
	onMounted(() => nextTick(() => revertAnimations = useAnimations($el.value, blok, blok.animations, () => booted.value = true,() => animationsInited.value = true)));
	onUnmounted(() => revertAnimations?.());
</script>
<style lang="scss">
@use 'sass:color';
.BodySimpleText{
	background-size: cover;
	border: 1px solid transparent;
	box-sizing: border-box;
	&.h3{
		>*{
			font-size: 2.3rem;
			line-height: 1.4em;
			@include media(1280){
				font-size: 3rem;
			}
			@include media(900){
				font-size: 2.9rem;
			}
			@include media(860){
				font-size: 2.3rem; line-height: 3rem;
			}
			@include media(550){
				font-size: 2rem;
			}
		}
	}
	.SimpleIcon{
		font-size:mw(3);
		align-self:flex-start;
		justify-self:flex-start;
		margin-bottom:mw(1);
		
	}
	img{
		max-width: 100%;
		height: auto;
	}
    .words-mask,
    .lines-mask{
        padding-bottom: .18em;
        margin-bottom: -.18em;
    }
	&.vertical{
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	&.align-items-center{
		align-items: center;
	}
	.label, .labelWhite{
		color: $text;
		border: 1px solid $text;
		padding: 1.5rem 2rem;
		border-radius: 10rem;
		margin-bottom: 2rem;
		display: inline-block;
	}
	.labelWhite{
		color: $white;
		border-color: $white;
	}
}
</style>