<template lang="pug">
section.BodyPageHead(v-editable="blok" :id="blok.id" :class="mw.classes")
	.label(v-if="blok.label") {{ blok.label }}
	.text(v-if="blok.text?.length")
		StoryblokComponent(:blok="blok.text[0]" v-editable="blok.text[0]")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.BodyPageHead{
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: mw(2);
	width: 100%;
	box-sizing: border-box;
	padding: mw(10) mw(2);
	color: $blue;
	.label{
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: mw(1) mw(2);
		border: 1px solid currentColor;
		border-radius: mw(.75);
		font-size: 1.6rem;
		font-weight: 500;
		text-transform: uppercase;
		@include media(550){
			padding: mw(3) mw(5);
			border-radius: mw(2);
		}
	}
	.text{
		max-width: mw(60);
		.BodySimpleText{
			display: flex;
			flex-direction: column;
			gap: mw(2);
		}
	}
	@include media(860){
		padding: mw(15) mw(2) mw(10);
		.text{
			max-width: 100%;
		}
	}
	@include media(550){
		gap: mw(5);
		padding: mw(30) mw(5) mw(15);
		.text .BodySimpleText{
			gap: mw(5);
		}
	}
}
</style>
