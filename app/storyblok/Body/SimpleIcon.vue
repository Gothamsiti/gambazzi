<template lang="pug">
.SimpleIcon(:class="[blok.class, ...mw.classes]" :style="{...mw.style}")
	Icon(v-if="blok.icon" :name="blok.icon")
	.label(v-if="blok.label") {{blok.label}}
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.SimpleIcon{
	display: flex;
	flex-direction: column;
	gap: 1em;
	align-items: center;
	justify-content: center;
	&.middle{
		.iconify{
			font-size: 4rem;
		}
	}
	&.big{
		.iconify{
			font-size: 8rem;
		}
	}
}
</style>