<template lang="pug">
NuxtLink.BodyCTA(:to="$__url(blok.link?.cached_url+(blok.link?.cached_url?.includes('#')?'':anchor||''))" :class="mw.classes" :target="blok.link?.target" :style="ctaStyle" @click.capture="onClick" ref="$el")
	.icon(v-if="blok.icon")
		Icon(:name="blok.icon")
	.label(v-if="blok.label") {{ blok.label }}
</template>
<script setup>
	const { resolveForm, open, forms } = useModalForms();
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
	const $el = ref();
	const animationsInited = ref(false);
	// se un'animazione parte da opacity, l'elemento resta nascosto finché le animazioni non sono inizializzate
	const initialOpacity = computed(() => {
		return animationsInited.value ? {} : {
			opacity: (blok.animations || []).some(a => (a.properties || []).some(p => p.key === 'opacity')) ? 0 : 1
		};
	});
	const ctaStyle = computed(() => ({...mw.style, ...initialOpacity.value}));
	const anchor = computed(() => blok.link?.anchor ? `#${blok.link.anchor}` : blok.link?.cached_url?.includes('#') ? `#${blok.link.cached_url.split('#')[1]}` : null);
	const formSlug = computed(() => anchor.value?.includes('#modal-') ? anchor.value?.replace(/^#modal-/, '') : undefined);
	const form = computed(() => { return anchor.value ? resolveForm(formSlug.value) : undefined; });
	const onClick = (e) => {
		if (anchor.value && form.value) {
			e.preventDefault();
			open(formSlug.value);
		}else if(anchor.value){
			e.preventDefault();
			const el = document.querySelector(anchor.value);
			console.log(anchor.value,el);
			if(el){
				el.scrollIntoView({ behavior: 'smooth' });
			}
		}
	};

	let revertAnimations;
	onMounted(() => nextTick(() => {
		const el = $el.value?.$el ?? $el.value;
		if (el) revertAnimations = useAnimations(el, blok, blok.animations, undefined, () => animationsInited.value = true);
	}));
	onUnmounted(() => revertAnimations?.());
</script>
<style lang="scss">
.BodyCTA{
	&:not(.noStyles){
		display: flex;
		align-items: center;
		justify-content: center;
		gap:2px;
		>*{
			display: flex;
			align-items: center;
			justify-content: center;
			border:1px solid $black;
			height: 3.6rem;
		}
		.icon{
			width: 3.6rem;
			flex:0 0 3.6rem;
		}
		.label{
			font-size: 1.6rem;;
			flex: 0 0 auto;
			padding: 0 mw(1);
			text-transform: uppercase;
		}
		&.black{
			color: $white !important;
			>*{
				background: $black;
			}
		}
	}
	&.big{
		
	}
}
</style>