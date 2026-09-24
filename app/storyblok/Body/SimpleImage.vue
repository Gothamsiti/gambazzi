<template lang="pug">
ImageItem.SimpleImage(:id="blok.id || undefined" :blok="blok.image" :class="[blok.class, ...mw.classes]" :style="{...mw.style}")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.SimpleImage{
	overflow:hidden;
	background-color: #f3f3f3;
	&.transparent-background{
		background-color: transparent;
	}
}
</style>