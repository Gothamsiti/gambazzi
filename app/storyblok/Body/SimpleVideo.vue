<template lang="pug">
.SimpleVideo(:id="blok.id || undefined" :class="mw.classes" :style="mw.style")
	video(ref="$video" :fetchpriority="blok.fetchPriorityHight ? 'high' : 'low'" :src="shouldLoad ? videoSrc : undefined" :poster="shouldLoad ? posterSrc : undefined" :title="videoTitle" :autoplay="autoplay" :muted="muted" :loop="loop" playsinline webkit-playsinline preload="none")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);

	const toAssetUrl = (filename) => filename ? filename.replace('https://a.storyblok.com', '/storyblokasset') : undefined;
	const toWebpAssetUrl = (filename) => {
		const assetUrl = toAssetUrl(filename);
		return assetUrl && !filename.split('?')[0].toLowerCase().endsWith('.svg')
			? `${assetUrl}/m/filters:format(webp)`
			: assetUrl;
	};
	// const toAssetUrl = (filename) => filename ? filename : undefined;

	// i video Storyblok passano da /videoasset, che li copia su R2 al primo accesso e poi li serve da lì
	const toVideoUrl = (filename) => filename ? filename.replace('https://a.storyblok.com', '/videoasset') : undefined;

	const videoSrc = computed(() => toVideoUrl(blok.asset?.filename));
	const posterSrc = computed(() => toWebpAssetUrl(blok.poster?.filename));
	const videoTitle = computed(() => blok.asset?.title || undefined);

	const autoplay = computed(() => blok.autoplay !== false);
	const loop = computed(() => blok.loop !== false);
	const muted = computed(() => blok.muted !== false);

	const $video = ref();
	// poster e video vengono scaricati solo quando l'elemento si avvicina alla viewport
	const shouldLoad = ref(false);
	const inView = ref(false);
	let observer;

	onMounted(() => {
		if (!$video.value) return;
		$video.value.muted = muted.value;
		observer = new IntersectionObserver((entries) => entries.forEach(entry => {
			inView.value = entry.isIntersecting;
			if (entry.isIntersecting) shouldLoad.value = true;
		}), { rootMargin: '300px', threshold: 0 });
		observer.observe($video.value);
	});

	onBeforeUnmount(() => observer?.disconnect());

	// play/pause solo quando è realmente visibile, per non tenere il video attivo fuori schermo
	watch([shouldLoad, inView], async () => {
		if (!shouldLoad.value || !autoplay.value) return;
		await nextTick();
		if (!$video.value) return;
		if (inView.value) $video.value.play?.().catch(() => {});
		else $video.value.pause?.();
	});
</script>
<style lang="scss">
.SimpleVideo{
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	object-fit: cover;
	background:$black;
	video{
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}
</style>
