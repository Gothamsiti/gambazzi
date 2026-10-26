<template lang="pug">
section.BodyStoriesList(v-if="stories.length || sbEditor" :id="blok.id || undefined" :class="mw.classes" :style="bgStyle")
	.head
		.title(v-if="blok.title?.[0]")
			StoryblokComponent(:blok="blok.title[0]" v-editable="blok.title[0]")
		.arrows(v-if="showArrows")
			button.arrow.arrow--left(type="button" :class="{ 'is-disabled': !canScrollLeft }" :aria-disabled="!canScrollLeft" @click="moveScroll(-1)" :aria-label="label('previous', 'Precedente')")
				Icon(:name="'gotham:arrow-right'" aria-hidden="true")
			button.arrow.arrow--right(type="button" :class="{ 'is-disabled': !canScrollRight }" :aria-disabled="!canScrollRight" @click="moveScroll(1)" :aria-label="label('next', 'Successivo')")
				Icon(:name="'gotham:arrow-right'" aria-hidden="true")
	.list(ref="scrollRoot")
		NuxtLink.card(v-for="story in stories" :key="story.uuid" :to="$__url(story.full_slug)")
			imageItem.image(v-if="story.content?.cardImage?.filename" :blok="story.content.cardImage" sizes="(max-width: 550px) 80vw, 35vw")
			.label(v-if="story.content?.cardLabel") {{ story.content.cardLabel }}
			.h4.cardTitle {{ story.content?.cardTitle || story.name }}
			.p.cardText(v-if="story.content?.cardText") {{ story.content.cardText }}
			.p.link(v-if="blok.linkLabel") {{ blok.linkLabel }}
	.cta(v-if="blok.cta?.[0]")
		StoryblokComponent(:blok="blok.cta[0]" v-editable="blok.cta[0]")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
	const { $__ } = useNuxtApp();
	// finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
	const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };
	const { sbEditor } = useStoryblokEditor();
	const { currentLanguage, defaultLanguage } = useLanguage();
	const { $__parseEndpoint } = useNuxtApp();
	const { endpoint: currentSlug } = $__parseEndpoint();

	const bgStyle = computed(() => ({
		backgroundColor: blok.backgroundColor,
		color: blok.color,
		...mw.style,
	}));

	// le startpage delle folder (es. soluzioni/) non sono mai una card;
	// il body delle story non serve alle card e appesantirebbe il payload della pagina
	const query = computed(() => ({
		starts_with: blok.folder || undefined,
		excluding_fields: 'body',
		content_type: blok.contentType || undefined,
		sort_by: blok.sortBy || 'position:asc',
		per_page: Number(blok.limit) || 100,
		is_startpage: false,
		excluding_slugs: blok.excludeCurrent ? currentSlug : undefined,
		language: currentLanguage.value !== defaultLanguage.value ? currentLanguage.value : undefined,
		isEditor: sbEditor.value,
	}));

	const { data } = await useAsyncData(
		() => `BodyStoriesList:${JSON.stringify(query.value)}`,
		() => $fetch('/api/storyblok/request', { query: query.value }),
		{ watch: [query] }
	);
	// /api/storyblok/request restituisce un array, oppure { stories, rels } quando ci sono relazioni
	const stories = computed(() => (Array.isArray(data.value) ? data.value : data.value?.stories) || []);

	const scrollRoot = ref(null);
	const { showArrows, moveScroll, canScrollLeft, canScrollRight, requestUpdate } = useHorizontalScrollbar({
		scrollRoot,
		enabled: true,
		arrows: true,
	});
	watch(stories, () => nextTick(requestUpdate));
</script>
<style lang="scss">
@use "sass:color";

.BodyStoriesList{
	display: flex;
	flex-direction: column;
	gap: mw(4);
	width: 100%;
	box-sizing: border-box;
	padding: mw(10) 0;
	background-color: $greyDark;
	color: $white;
	.head{
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: mw(2);
		padding: 0 mw(2);
		.title{
			max-width: mw(50);
		}
	}
	.arrows{
		display: flex;
		gap: mw(.5);
		@include media(550){
			display: none;
		}
	}
	.arrow{
		cursor: pointer;
		padding: 0;
		border: 0;
		color: inherit;
		font: inherit;
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
		&--left .iconify{
			transform: rotate(180deg);
		}
	}
	.list{
		display: flex;
		gap: mw(3);
		padding: 0 mw(2);
		overflow-x: auto;
		scrollbar-width: none;
		&::-webkit-scrollbar{
			display: none;
		}
	}
	.card{
		flex: 0 0 mw(26);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: mw(1);
		@include media(550){
			flex: 0 0 mw(65);
			gap: mw(3);
		}
		.image{
			width: 100%;
			aspect-ratio: 516 / 338;
			border-radius: $dbr;
			margin-bottom: mw(1);
		}
		.label{
			padding: 1rem 1rem;
			border: 1px solid currentColor;
			border-radius: 10rem;
			font-size: 1.6rem;
			line-height: 1em;
			text-transform: uppercase;
		}
		.link{
			margin-top: mw(.5);
			text-decoration: underline;
			text-underline-offset: .2em;
		}
	}
	.cta{
		display: flex;
		justify-content: center;
		padding: mw(6) mw(2) 0;
	}
}
</style>
