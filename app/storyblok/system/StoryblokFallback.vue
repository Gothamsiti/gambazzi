<template lang="pug">
	.storyblok-fallback(v-editable="blok")
		p {{ blok.component }}
		pre {{ JSON.stringify(blok, null, 2) }}
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
</script>
<style lang="scss" scoped>
	.storyblok-fallback {
		margin: 1rem;
		padding: 1rem;
		border: 2px dashed #e00;
		background: #fff5f5;
		color: #000;
		font-family: monospace;
		font-size: 12px;
		p {
			margin: 0 0 .5rem;
			font-weight: 700;
			color: #e00;
		}
		pre {
			margin: 0;
			white-space: pre-wrap;
			word-break: break-all;
			max-height: 400px;
			overflow: auto;
		}
	}
</style>
